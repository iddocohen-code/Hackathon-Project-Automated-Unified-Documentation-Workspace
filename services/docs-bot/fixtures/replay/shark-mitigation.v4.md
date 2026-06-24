# Shark Mitigation Protocol (v4)

This protocol describes the response procedure when a shark is detected in the monitored surf zone. All lifeguards and console operators must be familiar with these steps.

## Step 1: Confirm the sighting

Verify the shark detection via at least two independent sources — buoy telemetry, drone feed, or a visual report from a certified observer. Do not act on a single unconfirmed signal.

## Step 2: Trigger the Emergency Shark Siren

The **Emergency Shark Siren** is the primary zone-wide evacuation trigger. Once the sighting is confirmed, open the **Mitigation Panel** and press the red **Emergency Shark Siren** button at the top of the action row. This button calls `triggerSiren()` and broadcasts the evacuation siren across all zones immediately.

The panel has two states. In the **default state**, the zone status pill reads **Clear** and no banner is shown. Press the **Emergency Shark Siren** button → the panel enters the **Siren active** state: an **Evacuation siren broadcasting across all zones** banner appears with an `alert-triangle` icon, and the zone status pill flips from **Clear** to **Siren active**.

This is a `critical` action — it activates immediate zone-wide evacuation across every monitored zone. Use it only on a confirmed sighting.

## Step 3: Clear the water

Reinforce the siren with the standard PA system and activate the red flag protocol. Direct all surfers and swimmers to exit the water immediately. Coordinate with beach marshals to enforce the exclusion zone.

## Step 4: Establish a safety perimeter

Define a 200-meter exclusion perimeter around the last confirmed sighting location. Log the GPS coordinates and timestamp in the incident record. Notify neighbouring beach operators via the shared radio channel.

## Step 5: Monitor and document

Maintain continuous observation until the shark has moved outside the perimeter or 60 minutes have elapsed with no further sightings. File a full incident report in the Surf Console within 2 hours of the all-clear, including buoy telemetry data for the event window.

---

*Version 4 — last updated March 2025. Emergency Shark Siren integrated as the primary zone-wide evacuation trigger on the Mitigation Panel.*