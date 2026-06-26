<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdUnit;
use App\Models\Adjustment;
use App\Models\AuditLog;
use App\Models\Payout;
use App\Models\Publisher;
use App\Models\Website;
use App\Models\User;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * GET /api/v1/admin/audit-logs
     *
     * Supports filters: action, entity_type, date_from, date_to, user_id, search, publisher_id
     * Returns server-side paginated results (25 per page) with resolved publisher_context on each log.
     */
    public function index(Request $request)
    {
        $query = AuditLog::with('user:id,name,email')->latest();

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('entity_type')) {
            $query->where('entity_type', $request->entity_type);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('entity_id', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Publisher filter: return all audit logs related to a specific publisher:
        // their own Publisher record + all linked Websites, AdUnits, Payouts, Adjustments.
        if ($request->filled('publisher_id')) {
            $publisherId = $request->publisher_id;

            $publisher = Publisher::with([
                'websites.adUnits',
                'payouts',
                'adjustments',
            ])->find($publisherId);

            if ($publisher) {
                $websiteIds    = $publisher->websites->pluck('id')->toArray();
                $adUnitIds     = $publisher->websites->flatMap(fn($w) => $w->adUnits->pluck('id'))->toArray();
                $payoutIds     = $publisher->payouts->pluck('id')->toArray();
                $adjustmentIds = $publisher->adjustments->pluck('id')->toArray();
                $ticketIds     = \App\Models\Ticket::where('publisher_id', $publisherId)->pluck('id')->toArray();

                $query->where(function ($q) use ($publisherId, $websiteIds, $adUnitIds, $payoutIds, $adjustmentIds, $ticketIds) {
                    $q->where(function ($sq) use ($publisherId) {
                        $sq->where('entity_type', 'Publisher')->where('entity_id', $publisherId);
                    });
                    if (!empty($websiteIds)) {
                        $q->orWhere(function ($sq) use ($websiteIds) {
                            $sq->where('entity_type', 'Website')->whereIn('entity_id', $websiteIds);
                        });
                    }
                    if (!empty($adUnitIds)) {
                        $q->orWhere(function ($sq) use ($adUnitIds) {
                            $sq->where('entity_type', 'AdUnit')->whereIn('entity_id', $adUnitIds);
                        });
                    }
                    if (!empty($payoutIds)) {
                        $q->orWhere(function ($sq) use ($payoutIds) {
                            $sq->where('entity_type', 'Payout')->whereIn('entity_id', $payoutIds);
                        });
                    }
                    if (!empty($adjustmentIds)) {
                        $q->orWhere(function ($sq) use ($adjustmentIds) {
                            $sq->where('entity_type', 'Adjustment')->whereIn('entity_id', $adjustmentIds);
                        });
                    }
                    if (!empty($ticketIds)) {
                        $q->orWhere(function ($sq) use ($ticketIds) {
                            $sq->where('entity_type', 'Ticket')->whereIn('entity_id', $ticketIds);
                        });
                    }
                });
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        $logs = $query->paginate(25);

        // ── Batch-resolve publisher_context for every log on this page ──
        // Collect entity IDs by type so we can do at most 6 bulk queries
        $collection = $logs->getCollection();

        $pubIds        = $collection->where('entity_type', 'Publisher')  ->pluck('entity_id')->filter()->unique()->values();
        $websiteIds    = $collection->where('entity_type', 'Website')    ->pluck('entity_id')->filter()->unique()->values();
        $payoutIds     = $collection->where('entity_type', 'Payout')     ->pluck('entity_id')->filter()->unique()->values();
        $adjustmentIds = $collection->where('entity_type', 'Adjustment') ->pluck('entity_id')->filter()->unique()->values();
        $adUnitIds     = $collection->where('entity_type', 'AdUnit')     ->pluck('entity_id')->filter()->unique()->values();
        $ticketIds     = $collection->where('entity_type', 'Ticket')     ->pluck('entity_id')->filter()->unique()->values();
        $adminIds      = $collection->where('entity_type', 'Admin')      ->pluck('entity_id')->filter()->unique()->values();

        $publishers  = $pubIds->isNotEmpty()
            ? Publisher::select('id', 'name', 'email', 'status')->whereIn('id', $pubIds)->get()->keyBy('id')
            : collect();

        $websites    = $websiteIds->isNotEmpty()
            ? Website::with('publisher:id,name,email,status')->select('id', 'publisher_id')->whereIn('id', $websiteIds)->get()->keyBy('id')
            : collect();

        $payouts     = $payoutIds->isNotEmpty()
            ? Payout::with('publisher:id,name,email,status')->select('id', 'publisher_id')->whereIn('id', $payoutIds)->get()->keyBy('id')
            : collect();

        $adjustments = $adjustmentIds->isNotEmpty()
            ? Adjustment::with('publisher:id,name,email,status')->select('id', 'publisher_id')->whereIn('id', $adjustmentIds)->get()->keyBy('id')
            : collect();

        $adUnits     = $adUnitIds->isNotEmpty()
            ? AdUnit::with('website.publisher:id,name,email,status')->select('id', 'website_id')->whereIn('id', $adUnitIds)->get()->keyBy('id')
            : collect();

        $tickets     = $ticketIds->isNotEmpty()
            ? \App\Models\Ticket::with('publisher:id,name,email,status')->select('id', 'publisher_id')->whereIn('id', $ticketIds)->get()->keyBy('id')
            : collect();

        $admins      = $adminIds->isNotEmpty()
            ? User::select('id', 'name', 'email', 'is_active')->whereIn('id', $adminIds)->get()->keyBy('id')
            : collect();

        $collection->transform(function ($log) use ($publishers, $websites, $payouts, $adjustments, $adUnits, $tickets, $admins) {
            $pub = match ($log->entity_type) {
                'Publisher'  => $publishers->get($log->entity_id),
                'Website'    => $websites->get($log->entity_id)?->publisher,
                'Payout'     => $payouts->get($log->entity_id)?->publisher,
                'Adjustment' => $adjustments->get($log->entity_id)?->publisher,
                'AdUnit'     => $adUnits->get($log->entity_id)?->website?->publisher,
                'Ticket'     => $tickets->get($log->entity_id)?->publisher,
                default      => null,
            };

            $log->publisher_context = $pub ? [
                'id'     => $pub->id,
                'name'   => $pub->name,
                'email'  => $pub->email,
                'status' => $pub->status ?? null,
            ] : null;

            $admin = $log->entity_type === 'Admin' ? $admins->get($log->entity_id) : null;
            $log->admin_context = $admin ? [
                'id'        => $admin->id,
                'name'      => $admin->name,
                'email'     => $admin->email,
                'is_active' => $admin->is_active,
            ] : null;

            return $log;
        });

        return response()->json($logs);
    }
}
