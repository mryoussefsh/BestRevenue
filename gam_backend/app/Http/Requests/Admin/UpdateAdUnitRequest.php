<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAdUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'website_id'       => 'sometimes|required|uuid|exists:websites,id',
            'gam_ad_unit_name' => 'sometimes|required|string|max:500',
            'display_name'     => 'sometimes|required|string|max:255',
            'ratio_override'   => 'nullable|numeric|min:0.01|max:1', // FIX-26: 0% share not allowed
            'is_active'        => 'boolean',
            'ad_type'          => 'sometimes|required|string|in:banner,reward,interstitial,anchor,float_top,float_bottom,float_fullscreen',
            'ad_subtype'       => 'sometimes|nullable|string|in:normal,repeated,top,bottom',
            'repeat_count'     => 'sometimes|nullable|integer|min:0|max:100',
            'delay_between_ads'=> 'sometimes|nullable|integer|min:0|max:3600',
        ];
    }
}
