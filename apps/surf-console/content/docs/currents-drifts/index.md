# Currents & Drifts

The Currents & Drifts panel provides a live network log of observed ocean currents and drift vectors across the monitored surf zone. Operators use it to track water movement patterns and identify hazardous flow conditions in real time.

## Flow table

The main view is a scrollable flow table listing each active sensor point with the following columns:

- **Location** — named reference point or buoy ID.
- **Direction** — cardinal direction of net drift, updated every 5 minutes.
- **Speed (m/s)** — average current speed over the most recent measurement window.
- **Status** — a colour-coded pill summarising risk level (see below).

Rows are sorted by Status severity, most hazardous first.

## Status pills

| Pill colour | Label | Meaning |
|-------------|-------|---------|
| Green | Normal | Current speed and direction pose no unusual hazard. |
| Amber | Caution | Elevated speed or an outward drift vector; monitor closely. |
| Red | Rip Current | Rip current danger index exceeds threshold 7; immediate attention required. |

A red Rip Current pill appears automatically when the rip current danger index for that sensor point rises above 7. Operators should cross-reference the location on the map overlay and alert beach marshals.

## Filtering and export

Use the filter bar above the table to narrow by Status, location name, or direction. The **Export CSV** button downloads the current table view for offline analysis or incident logging.

---

*Version 1 — initial documentation.*
