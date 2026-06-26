<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\RegistrationPendingMail;
use App\Mail\RegistrationActiveMail;
use App\Models\Publisher;
use App\Models\RatioHistory;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Services\AuditLogService;

class RegisterController extends Controller
{
    /**
     * POST /api/v1/auth/register
     * Self-registration for new publishers.
     */
    public function register(Request $request): JsonResponse
    {
        $regStatus = Setting::get('registration_status', 'open');
        if ($regStatus === 'closed') {
            return response()->json([
                'message' => __('auth.registration_closed'),
            ], 422);
        }

        $request->validate([
            'name'     => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z\s]+$/'],
            'email'    => 'required|email|unique:users,email|unique:publishers,email',
            'password' => 'required|string|min:8|confirmed',
            // At least one contact field required (enforced below)
            'phone'    => 'nullable|string|max:50',
            'telegram' => 'nullable|string|max:100',
        ], [
            'name.regex' => __('validation.custom.name.regex')
        ]);

        // Ensure at least one contact field is provided
        if (empty($request->phone) && empty($request->telegram)) {
            return response()->json([
                'message' => __('auth.contact_message'),
                'errors'  => [
                    'contact' => [__('auth.contact_error')]
                ],
            ], 422);
        }

        // FIX [R-1]: Do NOT perform IP geolocation synchronously during registration.
        // A slow/down ipinfo.io would block ALL registrations. Instead, store the IP
        // and dispatch a background job to fill in the country later.
        // $country = $this->detectCountry($request->ip());  // ← REMOVED
        $regIp = $request->header('CF-Connecting-IP') 
            ?? $request->header('X-Real-IP') 
            ?? $request->ip();
        if ($regIp) {
            $regIp = trim(explode(',', $regIp)[0]);
        }

        // Get default registration status from settings
        $defaultStatus = Setting::where('key', 'publisher_registration_status')->value('value') ?? 'pending';
        // Normalize: only allow 'active' or 'pending'
        $status = in_array($defaultStatus, ['active', 'pending']) ? $defaultStatus : 'pending';

        DB::beginTransaction();

        try {
            $defaultRatio = Setting::where('key', 'publisher_default_ratio')->value('value') ?? 70;
            $defaultRatio = (float) $defaultRatio / 100;

            // Create Publisher record
            $publisher = Publisher::create([
                'id'            => Str::uuid()->toString(),
                'name'          => $request->name,
                'email'         => $request->email,
                'default_ratio' => $defaultRatio,
                'status'        => $status,
                'phone'         => $request->phone ?? null,
                'telegram'      => $request->telegram ?? null,
                'country'       => null,  // FIX [R-1]: Set async via GeolocatePublisherJob
                'reg_ip'        => $regIp,
                'last_ip'       => $regIp,
            ]);

            // Create User account
            $user = User::create([
                'id'           => Str::uuid()->toString(),
                'name'         => $request->name,
                'email'        => $request->email,
                'password'     => Hash::make($request->password),
                'role'         => 'publisher',
                'publisher_id' => $publisher->id,
                'is_active'    => $status === 'active',
            ]);

            // Log initial ratio history
            RatioHistory::create([
                'id'          => Str::uuid()->toString(),
                'entity_type' => 'publisher',
                'entity_id'   => $publisher->id,
                'old_ratio'   => null,
                'new_ratio'   => $publisher->default_ratio,
                'changed_by'  => $user->id,
                'changed_at'  => now(),
            ]);

            DB::commit();

            // FIX [R-1]: Dispatch async geolocation job AFTER commit
            // so the publisher ID exists in DB before the job runs.
            \App\Jobs\GeolocatePublisherJob::dispatch($publisher->id, $regIp);

            AuditLogService::log('registered', 'Publisher', $publisher->id, null, [
                'name'    => $publisher->name,
                'email'   => $publisher->email,
                'status'  => $status,
                'reg_ip'  => $regIp,
            ]);

            // If active → return token so they can log in immediately
            if ($status === 'active') {
                $token = $user->createToken('api-token', ['*'], now()->addMinutes(60))->plainTextToken;

                try { Mail::to($publisher->email)->send(new RegistrationActiveMail($publisher)); } catch (\Exception $e) {}

                return response()->json([
                    'status'       => 'active',
                    'message'      => 'Registration successful! Welcome to ' . config('app.name') . '.',
                    'access_token' => $token,
                    'token_type'   => 'Bearer',
                    'expires_in'   => 60 * 60,
                    'user'         => [
                        'id'           => $user->id,
                        'name'         => $user->name,
                        'email'        => $user->email,
                        'role'         => $user->role,
                        'publisher_id' => $user->publisher_id,
                        'pending_balance' => 0.0,
                    ],
                ], 201);
            }

            // Pending → just confirm registration
            $lang = $request->header('X-Locale') ?? $request->header('Accept-Language') ?? 'en';
            $isAr = str_starts_with(strtolower($lang), 'ar');
            $messageKey = $isAr ? 'publisher_pending_message_ar' : 'publisher_pending_message';

            $pendingMessage = Setting::where('key', $messageKey)->value('value')
                ?? Setting::where('key', 'publisher_pending_message')->value('value')
                ?? ($isAr 
                    ? 'تم استلام طلب التسجيل الخاص بك! حسابك تحت المراجعة حالياً، وسيتم إخطارك بمجرد الموافقة عليه.'
                    : 'Your registration has been received! Your account is pending admin review. You will be notified once it is approved.');

            try { Mail::to($publisher->email)->send(new RegistrationPendingMail($publisher)); } catch (\Exception $e) {}

            return response()->json([
                'status'  => 'pending',
                'message' => $pendingMessage,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            // FIX [R-3, SEC-8]: Do NOT expose internal exception messages in API responses.
            // Log internally but return a generic message to the client.
            \Illuminate\Support\Facades\Log::error('Registration failed: ' . $e->getMessage(), [
                'email' => $request->email ?? 'unknown',
                'ip'    => $request->ip(),
            ]);
            return response()->json([
                'message' => 'Registration failed. Please try again later.',
            ], 500);
        }
    }

    /**
     * Detect country code from IP address using free ipinfo.io API.
     *
     * FIX [R-1]: This method is now ONLY used by GeolocatePublisherJob (async).
     * It is NOT called during the registration HTTP request anymore.
     *
     * FIX [R-5]: Expanded private IP range detection to cover all RFC 1918 ranges
     * and carrier-grade NAT (100.64.x/10) as per IANA allocation.
     */
    public static function detectCountry(string $ip): ?string
    {
        // Sanitize: strip port or take first IP from X-Forwarded-For chain if passed
        $ip = trim(explode(',', $ip)[0]);

        $isLocal = (
            $ip === '127.0.0.1' ||
            $ip === '::1' ||
            str_starts_with($ip, '192.168.') ||   // RFC 1918 class C
            str_starts_with($ip, '10.')        ||  // RFC 1918 class A
            str_starts_with($ip, '100.64.')    ||  // RFC 6598 carrier-grade NAT
            preg_match('/^172\.(1[6-9]|2\d|3[01])\./', $ip) // RFC 1918 class B: 172.16.0.0–172.31.255.255
        );

        if ($isLocal && !app()->environment('local', 'testing')) {
            return null;
        }

        // Try ipinfo.io first
        try {
            $url = $isLocal ? "https://ipinfo.io/country" : "https://ipinfo.io/{$ip}/country";
            $response = file_get_contents($url, false, stream_context_create([
                'http' => ['timeout' => 3],
            ]));
            if ($response) {
                $country = trim($response);
                if (strlen($country) === 2) {
                    return self::getCountryNameFromCode($country);
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("RegisterController: ipinfo.io failed for IP {$ip}: " . $e->getMessage());
        }

        // Fallback to ip-api.com
        try {
            $url = $isLocal ? "http://ip-api.com/json/?fields=countryCode,status" : "http://ip-api.com/json/{$ip}?fields=countryCode,status";
            $response = file_get_contents($url, false, stream_context_create([
                'http' => ['timeout' => 3],
            ]));
            if ($response) {
                $data = json_decode($response, true);
                if (is_array($data) && ($data['status'] ?? '') === 'success' && !empty($data['countryCode'])) {
                    return self::getCountryNameFromCode(substr($data['countryCode'], 0, 2));
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("RegisterController: ip-api.com failed for IP {$ip}: " . $e->getMessage());
        }

        return null;
    }

    public static function getCountryNameFromCode(string $code): string
    {
        $code = strtoupper(trim($code));
        $countries = [
            'AF' => 'Afghanistan', 'AX' => 'Aland Islands', 'AL' => 'Albania', 'DZ' => 'Algeria', 'AS' => 'American Samoa',
            'AD' => 'Andorra', 'AO' => 'Angola', 'AI' => 'Anguilla', 'AQ' => 'Antarctica', 'AG' => 'Antigua and Barbuda',
            'AR' => 'Argentina', 'AM' => 'Armenia', 'AW' => 'Aruba', 'AU' => 'Australia', 'AT' => 'Austria',
            'AZ' => 'Azerbaijan', 'BS' => 'Bahamas', 'BH' => 'Bahrain', 'BD' => 'Bangladesh', 'BB' => 'Barbados',
            'BY' => 'Belarus', 'BE' => 'Belgium', 'BZ' => 'Belize', 'BJ' => 'Benin', 'BM' => 'Bermuda',
            'BT' => 'Bhutan', 'BO' => 'Bolivia', 'BQ' => 'Bonaire, Sint Eustatius and Saba', 'BA' => 'Bosnia and Herzegovina', 'BW' => 'Botswana',
            'BV' => 'Bouvet Island', 'BR' => 'Brazil', 'IO' => 'British Indian Ocean Territory', 'BN' => 'Brunei Darussalam', 'BG' => 'Bulgaria',
            'BF' => 'Burkina Faso', 'BI' => 'Burundi', 'CV' => 'Cabo Verde', 'KH' => 'Cambodia', 'CM' => 'Cameroon',
            'CA' => 'Canada', 'KY' => 'Cayman Islands', 'CF' => 'Central African Republic', 'TD' => 'Chad', 'CL' => 'Chile',
            'CN' => 'China', 'CX' => 'Christmas Island', 'CC' => 'Cocos (Keeling) Islands', 'CO' => 'Colombia', 'KM' => 'Comoros',
            'CD' => 'Congo (Democratic Republic)', 'CG' => 'Congo', 'CK' => 'Cook Islands', 'CR' => 'Costa Rica', 'CI' => 'Cote d\'Ivoire',
            'HR' => 'Croatia', 'CU' => 'Cuba', 'CW' => 'Curacao', 'CY' => 'Cyprus', 'CZ' => 'Czechia',
            'DK' => 'Denmark', 'DJ' => 'Djibouti', 'DM' => 'Dominica', 'DO' => 'Dominican Republic', 'EC' => 'Ecuador',
            'EG' => 'Egypt', 'SV' => 'El Salvador', 'GQ' => 'Equatorial Guinea', 'ER' => 'Eritrea', 'EE' => 'Estonia',
            'SZ' => 'Eswatini', 'ET' => 'Ethiopia', 'FK' => 'Falkland Islands', 'FO' => 'Faroe Islands', 'FJ' => 'Fiji',
            'FI' => 'Finland', 'FR' => 'France', 'GF' => 'French Guiana', 'PF' => 'French Polynesia', 'TF' => 'French Southern Territories',
            'GA' => 'Gabon', 'GM' => 'Gambia', 'GE' => 'Georgia', 'DE' => 'Germany', 'GH' => 'Ghana',
            'GI' => 'Gibraltar', 'GR' => 'Greece', 'GL' => 'Greenland', 'GD' => 'Grenada', 'GP' => 'Guadeloupe',
            'GU' => 'Guam', 'GT' => 'Guatemala', 'GG' => 'Guernsey', 'GN' => 'Guinea', 'GW' => 'Guinea-Bissau',
            'GY' => 'Guyana', 'HT' => 'Haiti', 'HM' => 'Heard Island and McDonald Islands', 'VA' => 'Holy See', 'HN' => 'Honduras',
            'HK' => 'Hong Kong', 'HU' => 'Hungary', 'IS' => 'Iceland', 'IN' => 'India', 'ID' => 'Indonesia',
            'IR' => 'Iran', 'IQ' => 'Iraq', 'IE' => 'Ireland', 'IM' => 'Isle of Man', 'IL' => 'Israel',
            'IT' => 'Italy', 'JM' => 'Jamaica', 'JP' => 'Japan', 'JE' => 'Jersey', 'JO' => 'Jordan',
            'KZ' => 'Kazakhstan', 'KE' => 'Kenya', 'KI' => 'Kiribati', 'KP' => 'North Korea', 'KR' => 'South Korea',
            'KW' => 'Kuwait', 'KG' => 'Kyrgyzstan', 'LA' => 'Laos', 'LV' => 'Latvia', 'LB' => 'Lebanon',
            'LS' => 'Lesotho', 'LR' => 'Liberia', 'LY' => 'Libya', 'LI' => 'Liechtenstein', 'LT' => 'Lithuania',
            'LU' => 'Luxembourg', 'MO' => 'Macao', 'MG' => 'Madagascar', 'MW' => 'Malawi', 'MY' => 'Malaysia',
            'MV' => 'Maldives', 'ML' => 'Mali', 'MT' => 'Malta', 'MH' => 'Marshall Islands', 'MQ' => 'Martinique',
            'MR' => 'Mauritania', 'MU' => 'Mauritius', 'YT' => 'Mayotte', 'MX' => 'Mexico', 'FM' => 'Micronesia',
            'MD' => 'Moldova', 'MC' => 'Monaco', 'MN' => 'Mongolia', 'ME' => 'Montenegro', 'MS' => 'Montserrat',
            'MA' => 'Morocco', 'MZ' => 'Mozambique', 'MM' => 'Myanmar', 'NA' => 'Namibia', 'NR' => 'Nauru',
            'NP' => 'Nepal', 'NL' => 'Netherlands', 'NC' => 'New Caledonia', 'NZ' => 'New Zealand', 'NI' => 'Nicaragua',
            'NE' => 'Niger', 'NG' => 'Nigeria', 'NU' => 'Niue', 'NF' => 'Norfolk Island', 'MP' => 'Northern Mariana Islands',
            'NO' => 'Norway', 'OM' => 'Oman', 'PK' => 'Pakistan', 'PW' => 'Palau', 'PS' => 'Palestine',
            'PA' => 'Panama', 'PG' => 'Papua New Guinea', 'PY' => 'Paraguay', 'PE' => 'Peru', 'PH' => 'Philippines',
            'PN' => 'Pitcairn', 'PL' => 'Poland', 'PT' => 'Portugal', 'PR' => 'Puerto Rico', 'QA' => 'Qatar',
            'RE' => 'Reunion', 'RO' => 'Romania', 'RU' => 'Russian Federation', 'RW' => 'Rwanda', 'BL' => 'Saint Barthelemy',
            'SH' => 'Saint Helena, Ascension and Tristan da Cunha', 'KN' => 'Saint Kitts and Nevis', 'LC' => 'Saint Lucia', 'MF' => 'Saint Martin', 'PM' => 'Saint Pierre and Miquelon',
            'VC' => 'Saint Vincent and the Grenadines', 'WS' => 'Samoa', 'SM' => 'San Marino', 'ST' => 'Sao Tome and Principe', 'SA' => 'Saudi Arabia',
            'SN' => 'Senegal', 'RS' => 'Serbia', 'SC' => 'Seychelles', 'SL' => 'Sierra Leone', 'SG' => 'Singapore',
            'SX' => 'Sint Maarten', 'SK' => 'Slovakia', 'SI' => 'Slovenia', 'SB' => 'Solomon Islands', 'SO' => 'Somalia',
            'ZA' => 'South Africa', 'GS' => 'South Georgia and the South Sandwich Islands', 'SS' => 'South Sudan', 'ES' => 'Spain', 'LK' => 'Sri Lanka',
            'SD' => 'Sudan', 'SR' => 'Suriname', 'SJ' => 'Svalbard and Jan Mayen', 'SE' => 'Sweden', 'CH' => 'Switzerland',
            'SY' => 'Syrian Arab Republic', 'TW' => 'Taiwan', 'TJ' => 'Tajikistan', 'TZ' => 'Tanzania', 'TH' => 'Thailand',
            'TL' => 'Timor-Leste', 'TG' => 'Togo', 'TK' => 'Tokelau', 'TO' => 'Tonga', 'TT' => 'Trinidad and Tobago',
            'TN' => 'Tunisia', 'TR' => 'Turkey', 'TM' => 'Turkmenistan', 'TC' => 'Turks and Caicos Islands', 'TV' => 'Tuvalu',
            'UG' => 'Uganda', 'UA' => 'Ukraine', 'AE' => 'United Arab Emirates', 'GB' => 'United Kingdom', 'UM' => 'United States Minor Outlying Islands',
            'US' => 'United States', 'UY' => 'Uruguay', 'UZ' => 'Uzbekistan', 'VU' => 'Vanuatu', 'VE' => 'Venezuela',
            'VN' => 'Viet Nam', 'VG' => 'Virgin Islands (British)', 'VI' => 'Virgin Islands (U.S.)', 'WF' => 'Wallis and Futuna', 'EH' => 'Western Sahara',
            'YE' => 'Yemen', 'ZM' => 'Zambia', 'ZW' => 'Zimbabwe'
        ];

        return $countries[$code] ?? $code;
    }

    public static function getCountryCodeFromName(string $name): ?string
    {
        $name = strtolower(trim($name));
        $countries = [
            'af' => 'Afghanistan', 'ax' => 'Aland Islands', 'al' => 'Albania', 'dz' => 'Algeria', 'as' => 'American Samoa',
            'ad' => 'Andorra', 'ao' => 'Angola', 'ai' => 'Anguilla', 'aq' => 'Antarctica', 'ag' => 'Antigua and Barbuda',
            'ar' => 'Argentina', 'am' => 'Armenia', 'aw' => 'Aruba', 'au' => 'Australia', 'at' => 'Austria',
            'az' => 'Azerbaijan', 'bs' => 'Bahamas', 'bh' => 'Bahrain', 'bd' => 'Bangladesh', 'bb' => 'Barbados',
            'by' => 'Belarus', 'be' => 'Belgium', 'bz' => 'Belize', 'bj' => 'Benin', 'bm' => 'Bermuda',
            'bt' => 'Bhutan', 'bo' => 'Bolivia', 'bq' => 'Bonaire, Sint Eustatius and Saba', 'ba' => 'Bosnia and Herzegovina', 'bw' => 'Botswana',
            'bv' => 'Bouvet Island', 'br' => 'Brazil', 'io' => 'British Indian Ocean Territory', 'bn' => 'Brunei Darussalam', 'bg' => 'Bulgaria',
            'bf' => 'Burkina Faso', 'bi' => 'Burundi', 'cv' => 'Cabo Verde', 'kh' => 'Cambodia', 'cm' => 'Cameroon',
            'ca' => 'Canada', 'ky' => 'Cayman Islands', 'cf' => 'Central African Republic', 'td' => 'Chad', 'cl' => 'Chile',
            'cn' => 'China', 'cx' => 'Christmas Island', 'cc' => 'Cocos (Keeling) Islands', 'co' => 'Colombia', 'km' => 'Comoros',
            'cd' => 'Congo (Democratic Republic)', 'cg' => 'Congo', 'ck' => 'Cook Islands', 'cr' => 'Costa Rica', 'ci' => 'Cote d\'Ivoire',
            'hr' => 'Croatia', 'cu' => 'Cuba', 'cw' => 'Curacao', 'cy' => 'Cyprus', 'cz' => 'Czechia',
            'dk' => 'Denmark', 'dj' => 'Djibouti', 'dm' => 'Dominica', 'do' => 'Dominican Republic', 'ec' => 'Ecuador',
            'eg' => 'Egypt', 'sv' => 'El Salvador', 'gq' => 'Equatorial Guinea', 'er' => 'Eritrea', 'ee' => 'Estonia',
            'sz' => 'Eswatini', 'et' => 'Ethiopia', 'fk' => 'Falkland Islands', 'fo' => 'Faroe Islands', 'fj' => 'Fiji',
            'fi' => 'Finland', 'fr' => 'France', 'gf' => 'French Guiana', 'pf' => 'French Polynesia', 'tf' => 'French Southern Territories',
            'ga' => 'Gabon', 'gm' => 'Gambia', 'ge' => 'Georgia', 'de' => 'Germany', 'gh' => 'Ghana',
            'gi' => 'Gibraltar', 'gr' => 'Greece', 'gl' => 'Greenland', 'gd' => 'Grenada', 'gp' => 'Guadeloupe',
            'gu' => 'Guam', 'gt' => 'Guatemala', 'gg' => 'Guernsey', 'gn' => 'Guinea', 'gw' => 'Guinea-Bissau',
            'gy' => 'Guyana', 'ht' => 'Haiti', 'hm' => 'Heard Island and McDonald Islands', 'va' => 'Holy See', 'hn' => 'Honduras',
            'hk' => 'Hong Kong', 'hu' => 'Hungary', 'is' => 'Iceland', 'in' => 'India', 'id' => 'Indonesia',
            'ir' => 'Iran', 'iq' => 'Iraq', 'ie' => 'Ireland', 'im' => 'Isle of Man', 'il' => 'Israel',
            'it' => 'Italy', 'jm' => 'Jamaica', 'jp' => 'Japan', 'je' => 'Jersey', 'jo' => 'Jordan',
            'kz' => 'Kazakhstan', 'ke' => 'Kenya', 'ki' => 'Kiribati', 'kp' => 'North Korea', 'kr' => 'South Korea',
            'kw' => 'Kuwait', 'kg' => 'Kyrgyzstan', 'la' => 'Laos', 'lv' => 'Latvia', 'lb' => 'Lebanon',
            'ls' => 'Lesotho', 'lr' => 'Liberia', 'ly' => 'Libya', 'li' => 'Liechtenstein', 'lt' => 'Lithuania',
            'lu' => 'Luxembourg', 'mo' => 'Macao', 'mg' => 'Madagascar', 'mw' => 'Malawi', 'my' => 'Malaysia',
            'mv' => 'Maldives', 'ml' => 'Mali', 'mt' => 'Malta', 'mh' => 'Marshall Islands', 'mq' => 'Martinique',
            'mr' => 'Mauritania', 'mu' => 'Mauritius', 'yt' => 'Mayotte', 'mx' => 'Mexico', 'fm' => 'Micronesia',
            'md' => 'Moldova', 'mc' => 'Monaco', 'mn' => 'Mongolia', 'me' => 'Montenegro', 'ms' => 'Montserrat',
            'ma' => 'Morocco', 'mz' => 'Mozambique', 'mm' => 'Myanmar', 'na' => 'Namibia', 'nr' => 'Nauru',
            'np' => 'Nepal', 'nl' => 'Netherlands', 'nc' => 'New Caledonia', 'nz' => 'New Zealand', 'ni' => 'Nicaragua',
            'ne' => 'Niger', 'ng' => 'Nigeria', 'nu' => 'Niue', 'nf' => 'Norfolk Island', 'mp' => 'Northern Mariana Islands',
            'no' => 'Norway', 'om' => 'Oman', 'pk' => 'Pakistan', 'pw' => 'Palau', 'ps' => 'Palestine',
            'pa' => 'Panama', 'pg' => 'Papua New Guinea', 'py' => 'Paraguay', 'pe' => 'Peru', 'ph' => 'Philippines',
            'pn' => 'Pitcairn', 'pl' => 'Poland', 'pt' => 'Portugal', 'pr' => 'Puerto Rico', 'qa' => 'Qatar',
            're' => 'Reunion', 'ro' => 'Romania', 'ru' => 'Russian Federation', 'rw' => 'Rwanda', 'bl' => 'Saint Barthelemy',
            'sh' => 'Saint Helena, Ascension and Tristan da Cunha', 'kn' => 'Saint Kitts and Nevis', 'lc' => 'Saint Lucia', 'mf' => 'Saint Martin', 'pm' => 'Saint Pierre and Miquelon',
            'vc' => 'Saint Vincent and the Grenadines', 'ws' => 'Samoa', 'sm' => 'San Marino', 'st' => 'Sao Tome and Principe', 'sa' => 'Saudi Arabia',
            'sn' => 'Senegal', 'rs' => 'Serbia', 'sc' => 'Seychelles', 'sl' => 'Sierra Leone', 'sg' => 'Singapore',
            'sx' => 'Sint Maarten', 'sk' => 'Slovakia', 'si' => 'Slovenia', 'sb' => 'Solomon Islands', 'so' => 'Somalia',
            'za' => 'South Africa', 'gs' => 'South Georgia and the South Sandwich Islands', 'ss' => 'South Sudan', 'es' => 'Spain', 'lk' => 'Sri Lanka',
            'sd' => 'Sudan', 'sr' => 'Suriname', 'sj' => 'Svalbard and Jan Mayen', 'se' => 'Sweden', 'ch' => 'Switzerland',
            'sy' => 'Syrian Arab Republic', 'tw' => 'Taiwan', 'tj' => 'Tajikistan', 'tz' => 'Tanzania', 'th' => 'Thailand',
            'tl' => 'Timor-Leste', 'tg' => 'Togo', 'tk' => 'Tokelau', 'to' => 'Tonga', 'tt' => 'Trinidad and Tobago',
            'tn' => 'Tunisia', 'tr' => 'Turkey', 'tm' => 'Turkmenistan', 'tc' => 'Turks and Caicos Islands', 'tv' => 'Tuvalu',
            'ug' => 'Uganda', 'ua' => 'Ukraine', 'ae' => 'United Arab Emirates', 'gb' => 'United Kingdom', 'um' => 'United States Minor Outlying Islands',
            'us' => 'United States', 'uy' => 'Uruguay', 'uz' => 'Uzbekistan', 'vu' => 'Vanuatu', 've' => 'Venezuela',
            'vn' => 'Viet Nam', 'vg' => 'Virgin Islands (British)', 'vi' => 'Virgin Islands (U.S.)', 'wf' => 'Wallis and Futuna', 'eh' => 'Western Sahara',
            'ye' => 'Yemen', 'zm' => 'Zambia', 'zw' => 'Zimbabwe'
        ];

        foreach ($countries as $code => $cName) {
            if (strtolower($cName) === $name) {
                return strtoupper($code);
            }
        }
        return null;
    }
}
