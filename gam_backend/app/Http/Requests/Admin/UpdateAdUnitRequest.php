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
        ];
    }
}
