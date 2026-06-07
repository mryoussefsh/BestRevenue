<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreWebsiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'publisher_id'     => 'required|uuid|exists:publishers,id',
            'gam_account_id'   => 'nullable|uuid|exists:gam_accounts,id',
            'domain'           => 'required|string|max:255|unique:websites,domain',
            'ratio_override'   => 'nullable|numeric|min:0.01|max:1', // FIX-26: 0% share not allowed
            'gam_network_code' => 'nullable|string|max:50',
            'is_active'        => 'boolean',
        ];
    }
}
