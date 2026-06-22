# Shark Incident Response Runbook

**Page ID:** RUNBOOK-SHARK-001  
**Space:** SURF Ops  
**Owner:** Diego Ramirez  
**Last Updated:** 2024-11-12  
**Status:** Approved

---

## Overview

This runbook describes the mandatory steps for responding to a confirmed or suspected shark sighting within a monitored surf zone. All lifeguard staff must be familiar with these steps before operating the SURF console.

---

## Step 1: Confirm the Sighting

- Verify via the buoy camera feed or direct visual observation.
- If uncertain, treat as confirmed and proceed to Step 2 immediately.

---

## Step 2: Activate the Emergency Shark Siren (One-Press)

**The primary evacuation trigger is the Emergency Shark Siren button on the SURF Mitigation Panel.**

1. Open the SURF console app.
2. Navigate to the **Mitigation Panel** (home screen shortcut).
3. Tap the red **"Emergency Shark Siren"** button — it appears at the top of the panel and requires a single tap.
4. Confirm the green activation toast appears within 200ms.

> **Note:** As of the SURF-142 update, this is a one-press action. No confirmation dialog is shown. A haptic pulse confirms the action on mobile devices.

The siren broadcasts to all zone buoy speakers and sends push evacuation alerts to all registered devices in the zone within 500ms of the tap.

---

## Step 3: Initiate Beach Evacuation

- Blow the evacuation whistle pattern (three long blasts).
- Direct all swimmers and surfers to exit the water immediately.
- Deploy the red evacuation flags at all zone entry points.

---

## Step 4: Alert Authorities

- Notify the local marine rescue coordination center via radio channel 16.
- Log the incident in the SURF console under **Incident Log > New Report**.

---

## Step 5: Post-Incident Review

- All siren activations are automatically logged with GPS coordinates, timestamp, and the activating user's ID.
- Complete the post-incident form within 24 hours.
- If the siren was triggered in error, file a false-positive report so the ML model can be updated.

---

## References

- SURF-142: Add one-press Emergency Shark Siren to mitigation panel
- #surf-safety Slack channel discussion (2024-11-08)
- SURF Zone Safety Standards v3.2

---

*This runbook is reviewed quarterly by the SURF Ops safety team.*
