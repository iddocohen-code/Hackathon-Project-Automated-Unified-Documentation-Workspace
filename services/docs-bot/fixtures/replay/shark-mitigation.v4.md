# Shark Mitigation Protocol (v4)

This protocol describes the response procedure when a shark is detected in the monitored surf zone. All lifeguards and console operators must be familiar with these steps.

## Step 1: Confirm the sighting

Verify the shark detection via at least two independent sources — buoy telemetry, drone feed, or a visual report from a certified observer. Do not act on a single unconfirmed signal.

## Step 2: Trigger the Emergency Shark Siren

Open the **Mitigation Panel** and press the red **Emergency Shark Siren** button at the top of the `SharkMitigationCard`. This is the primary evacuation trigger: a single press fires a zone-wide evacuation broadcast in under 500 ms, with no confirmation dialog and haptic feedback on mobile.

The panel exposes two states. In the **default state**, the **Emergency Shark Siren** button sits at the top of the panel, ready for a single press. Press the button → the activated **Siren active** state takes over: the zone-wide evacuation banner broadcasts across the surf zone and the panel status flips to **Siren active**.

This action carries `critical` impact — it activates immediate zone-wide evacuation. Use it the moment a sighting is confirmed.

## Step 3: Clear the water

Reinforce the siren broadcast using the standard PA system and activate the red flag protocol. Direct all surfers and swimmers to exit the water immediately. Coordinate with beach marshals to enforce the exclusion zone.

## Step 4: Establish a safety perimeter

Define a 200-meter exclusion perimeter around the last confirmed sighting location. Log the GPS coordinates and timestamp in the incident record. Notify neighbouring beach operators via the shared radio channel.

## Step 5: Monitor and document

Maintain continuous observation until the shark has moved outside the perimeter or 60 minutes have elapsed with no further sightings. File a full incident report in the Surf Console within 2 hours of the all-clear, including buoy telemetry data for the event window.

---

*Version 4 — last updated March 2025. One-press Emergency Shark Siren now serves as the primary evacuation trigger; manual PA protocol remains in effect as reinforcement.*