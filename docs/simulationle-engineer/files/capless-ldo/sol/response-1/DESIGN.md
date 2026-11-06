# PMOS-pass capacitor-free LDO

## Architecture

The DUT uses the external terminals `vin`, `vout`, `vss`, and `vref`.

A PMOS differential pair compares the internal feedback voltage with the ideal 0.4 V reference. An NMOS current-mirror load converts its differential current into the single-ended pass-gate control voltage. Increasing the feedback voltage increases the pass-gate voltage, reducing PMOS pass current and providing negative feedback.

The pass transistor is a wide PMOS with its source and bulk connected to `vin`. Its total width is 6000 Âµm, distributed over 100 fingers. The 0.5 Âµm channel length trades pass resistance against output resistance and gate capacitance.

A diode-connected PMOS and resistor to `vref` establish the amplifier bias. A nominal 3:1 PMOS mirror supplies the differential-pair tail. This branch draws current from `vin`; its current is not treated as free reference-supplied current. Bias varies with supply, temperature, and device corner.

The internal 150 kÎ©/100 kÎ© divider gives:
- Feedback fraction: 0.4.
- Ideal closed-loop output target: 1.0 V.
- Divider current at the target: 4 ÂµA.

The internal output capacitor is 900 pF. A 30 pF capacitor in series with 100 Î© connects the amplifier output to the regulator output for Miller compensation. Total explicit ideal capacitance is **930 pF**, below the 1 nF budget. MOS intrinsic capacitances are additional device parasitics.

## Parameters

All transistor dimensions are in micrometres.

| Parameter | Initial value | Purpose |
|---|---:|---|
| `pass_width` | 6000 | Pass strength and gate capacitance |
| `pass_length` | 0.5 | Pass resistance and intrinsic gain |
| `input_width` | 100 | Input-pair transconductance |
| `input_length` | 1 | Input-pair gain and capacitance |
| `mirror_width` | 10 | NMOS active-load sizing |
| `mirror_length` | 2 | NMOS active-load output resistance |
| `bias_width` | 10 | Bias diode geometry |
| `tail_width` | 30 | Tail-current mirror ratio |
| `bias_length` | 2 | Bias-mirror channel length |
| `bias_resistance` | 50 kÎ© | Bias-current setting |
| `feedback_upper` | 150 kÎ© | Feedback ratio and divider current |
| `feedback_lower` | 100 kÎ© | Feedback ratio and divider current |
| `output_capacitance` | 900 pF | Output charge storage |
| `miller_capacitance` | 30 pF | Loop compensation |
| `zero_resistance` | 100 Î© | Compensation zero adjustment |

All named parameters are referenced by devices. Device positions separate the bias, amplifier, pass, compensation, output, and feedback groups.

## Validation

This is the first complete design submission. No simulation tools were available during authoring, and no measured operating point or diagnostic results have yet been received.

The requested initial diagnostic condition is tt, 1.8 V input, 27 Â°C, with the operating point evaluated at 20 mA load. It has not yet been measured for this submission.

Analytical checks performed:
- Confirmed negative feedback polarity.
- Confirmed a nominal divider target of 1.0 V.
- Confirmed 930 pF total explicit ideal capacitance.
- Confirmed all MOS bulk connections and allowed model selections.
- Confirmed that each device has a unique name, explicit connectivity, and a separated schematic position.

DC regulation, no-load input current, PSR, load-step response, startup, convergence, and native export remain unmeasured. No electrical passing result is claimed.

## Limitations

The single-stage amplifier must directly charge and discharge the large pass-device gate. Slew rate and the interaction of gate, output, and compensation poles are important unverified risks.

The bias circuit is not a supply-independent current reference. Its variation may affect both quiescent current and loop dynamics. The amplifier input pair and active load also require headroom that must be checked at low supply and extreme corners.

There is no dedicated startup clamp, active overshoot sink, or adaptive gate driver. Startup overshoot and load-release recovery therefore require explicit simulation. At zero external load, the divider provides only a small discharge path.

The proposed compensation is an initial engineering choice, not a measured stability result. Nominal diagnostics alone would not establish the required full-corner, supply, and temperature compliance. Mismatch, extraction, physical capacitor implementation, and layout parasitics have not been evaluated.
