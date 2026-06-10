<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreAdUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'website_id'       => 'required|uuid|exists:websites,id',
            'gam_ad_unit_name' => 'required|string|max:500',
            'display_name'     => 'required|string|max:255',
            'ratio_override'   => 'nullable|numeric|min:0.01|max:1', // FIX-26: 0% share not allowed
            'is_active'        => 'boolean',
            'ad_type'          => 'required|string|in:banner,reward,interstitial,anchor,float_top,float_bottom,float_fullscreen',
            'ad_subtype'       => 'nullable|string|in:normal,repeated,top,bottom',
            'repeat_count'     => 'nullable|integer|min:1|max:100',
            'delay_between_ads'=> 'nullable|integer|min:1|max:3600',
        ];
    }
}
