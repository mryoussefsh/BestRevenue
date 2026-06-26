<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WebsiteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'publisher_id'     => $this->publisher_id,
            'domain'           => $this->domain,
            'gam_account_id'   => $this->gam_account_id,
            'gam_account_email'=> $this->gamAccount?->email,
            'ratio_override'   => $this->ratio_override !== null ? (float) $this->ratio_override : null,
            'gam_network_code' => $this->gam_network_code,
            'is_active'        => $this->is_active,
            'tracking_status'  => $this->tracking_status,
            'tracking_checked_at'=> $this->tracking_checked_at ? $this->tracking_checked_at->toIso8601String() : null,
            'created_at'       => $this->created_at,
            'updated_at'       => $this->updated_at,
            'publisher'        => $this->whenLoaded('publisher', function () {
                return [
                    'id'   => $this->publisher->id,
                    'name' => $this->publisher->name,
                ];
            }),
            'ad_units_count'   => $this->whenCounted('adUnits'),
        ];
    }
}
