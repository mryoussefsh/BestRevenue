<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdUnitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'website_id'       => $this->website_id,
            'gam_ad_unit_name' => $this->gam_ad_unit_name,
            'display_name'     => $this->display_name,
            'ratio_override'   => $this->ratio_override !== null ? (float) $this->ratio_override : null,
            'is_active'        => $this->is_active,
            'ad_type'          => $this->ad_type,
            'ad_subtype'       => $this->ad_subtype,
            'repeat_count'     => $this->repeat_count,
            'delay_between_ads'=> $this->delay_between_ads,
            'created_at'       => $this->created_at,
            'updated_at'       => $this->updated_at,
            'website'          => $this->whenLoaded('website', function () {
                return [
                    'id'     => $this->website->id,
                    'domain' => $this->website->domain,
                    'publisher_id' => $this->website->publisher_id,
                ];
            }),
        ];
    }
}
