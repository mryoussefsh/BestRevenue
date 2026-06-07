<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    /**
     * Log an action to the audit logs.
     *
     * @param string $action      e.g. 'created', 'updated', 'deleted', 'approved'
     * @param string $entityType  e.g. 'Publisher', 'Website', 'Setting'
     * @param string|null $entityId
     * @param array|null $oldValues
     * @param array|null $newValues
     */
    public static function log(string $action, string $entityType, ?string $entityId = null, ?array $oldValues = null, ?array $newValues = null)
    {
        $userId = Auth::id(); // Typically the admin user triggering the action

        // Filter out unchanged values if both arrays are provided
        if ($oldValues !== null && $newValues !== null) {
            $filteredOld = [];
            $filteredNew = [];
            foreach ($newValues as $key => $value) {
                if (!array_key_exists($key, $oldValues) || $oldValues[$key] !== $value) {
                    // It's a change or a new field
                    $filteredNew[$key] = $value;
                    if (array_key_exists($key, $oldValues)) {
                        $filteredOld[$key] = $oldValues[$key];
                    }
                }
            }
            $oldValues = empty($filteredOld) ? null : $filteredOld;
            $newValues = empty($filteredNew) ? null : $filteredNew;
            
            // If no actual changes, skip logging for 'updated' events
            if ($action === 'updated' && $oldValues === null && $newValues === null) {
                return;
            }
        }

        AuditLog::create([
            'user_id'     => $userId,
            'action'      => $action,
            'entity_type' => $entityType,
            'entity_id'   => $entityId,
            'old_values'  => $oldValues,
            'new_values'  => $newValues,
            'ip_address'  => Request::ip(),
        ]);
    }
}
