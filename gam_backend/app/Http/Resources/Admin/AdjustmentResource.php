<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdjustmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'publisher_id' => $this->publisher_id,
            'amount'       => (float) $this->amount,
            'notes'        => $this->notes,
            'status'       => $this->status,
            'period_closing_id' => $this->period_closing_id,
            'created_by'   => $this->created_by,
            'created_at'   => $this->created_at,
            'updated_at'   => $this->updated_at,
            
            // Nested relationships
            'publisher'    => [
                'id'    => $this->publisher?->id,
                'name'  => $this->publisher?->name,
                'email' => $this->publisher?->email,
            ],
            'creator'      => [
                'id'   => $this->creator?->id,
                'name' => $this->creator?->name,
            ],
        ];
    }
}
