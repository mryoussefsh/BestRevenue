<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'publisher_id' => 'required|exists:publishers,id',
            'amount'       => 'required|numeric|not_in:0',
            'notes'        => 'required|string',
        ];
    }
}
