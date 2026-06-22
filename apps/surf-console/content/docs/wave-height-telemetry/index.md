# Wave Height Telemetry

The Wave Height Telemetry page documents how the Surf Console ingests, displays, and interprets wave height data from the deployed buoy network.

## Data sources

Wave height readings are sourced from the coastal buoy array at 15-minute intervals. Each buoy reports significant wave height (Hs) in metres. The Console aggregates readings across all active buoys and displays a composite chart on the dashboard.

## Chart views

Two time-range views are available:

- **24-hour view** — high-resolution data for the current day, useful for identifying rapid swell changes.
- **7-day view** — a rolling week of data for trend analysis and swell forecasting.

Toggle between views using the range selector above the chart.

## Thresholds and alerts

| Wave height (Hs) | Status |
|------------------|--------|
| < 1.0 m | Calm |
| 1.0 – 2.5 m | Moderate |
| 2.5 – 4.0 m | High |
| > 4.0 m | Extreme — alert triggered |

When Hs exceeds 4.0 m on any buoy, the Console raises an automated alert and highlights the affected buoy in red on the map overlay.

## Data quality

Readings flagged as erroneous by the buoy firmware are excluded from the chart and marked with a data-gap indicator. If more than 20% of readings in a window are missing, the chart displays a degraded-data warning banner.

---

*Version 2 — updated April 2025 to add 7-day range support.*
