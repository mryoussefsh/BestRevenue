<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StorePublisherRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'          => 'required|string|max:200',
            'email'         => 'required|email|max:255|unique:publishers,email|unique:users,email',
            'password'      => 'required|string|min:8',
            // FIX [RAT-3 / FIX-26]: min:0.01 prevents setting a 0% publisher share.
            // A 0% ratio would give the publisher nothing and silently route all revenue to platform.
            'default_ratio' => 'required|numeric|min:0.01|max:1',
            'status'        => 'required|in:active,suspended',
            'payment_info'  => 'nullable|array',
            'notes'         => 'nullable|string',
            'phone'         => 'nullable|string|max:50',
            'telegram'      => 'nullable|string|max:100',
            'skype'         => 'nullable|string|max:100',
            'country'       => 'nullable|string|max:100',
            'reg_ip'        => 'nullable|string|max:45',
            'last_ip'       => 'nullable|string|max:45',
        ];
    }
}
