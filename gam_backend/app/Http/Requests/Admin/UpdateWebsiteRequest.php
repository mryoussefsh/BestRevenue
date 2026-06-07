<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWebsiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $websiteId = $this->route('website');

        return [
            'publisher_id'     => 'sometimes|required|uuid|exists:publishers,id',
            'gam_account_id'   => 'sometimes|nullable|uuid|exists:gam_accounts,id',
            'domain'           => 'sometimes|required|string|max:255|unique:websites,domain,' . $websiteId,
            'ratio_override'   => 'nullable|numeric|min:0.01|max:1', // FIX-26: 0% share not allowed
            'gam_network_code' => 'nullable|string|max:50',
            'is_active'        => 'boolean',
        ];
    }
}
