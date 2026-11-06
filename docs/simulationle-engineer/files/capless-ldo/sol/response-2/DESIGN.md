# PMOS-pass LDO â revision 2

## Architecture

The interface is `vin`, `vout`, `vss`, and `vref`.

A PMOS differential pair compares the internal feedback voltage against the ideal 0.4 V reference. Its NMOS current-mirror load drives a PMOS pass bank directly. An increase in output voltage increases feedback voltage, raises the pass-gate voltage, and reduces pass current.

The pass bank uses a 30 micrometre-wide, 0.5 micrometre-long PMOS instance with `nf=1` and multiplier 200. Its nominal aggregate channel width is 6000 micrometres. Unlike the first submission, the width presented to the device model selector is only 30 micrometres. This change addresses the actual model-selection error returned by the host.

A diode-connected PMOS and 50 kohm resistor to `vref` generate bias. A 3:1 PMOS mirror supplies the differential pair. Both bias-branch and amplifier currents are drawn from `vin` and count toward input quiescent current.

The internal 150 kohm/100 kohm divider produces a feedback fraction of 0.4 and an ideal output target of 1.0 V. Its target-voltage current is 4 microamperes.

Compensation consists of a 900 pF output capacitor and a 30 pF gate-to-output capacitor with a series 100 ohm resistor. Total explicit ideal capacitance is **930 pF**, within the 1 nF limit.

## Parameters

Geometry parameters are in micrometres.

| Parameter | Value | Function |
|---|---:|---|
| `pass_unit_width` | 30 | Width presented to pass-device model selection |
| `pass_multiplier` | 200 | Parallel pass strength and capacitance |
| `pass_length` | 0.5 | Pass resistance and output resistance |
| `input_width` | 100 | Differential-pair transconductance |
| `input_length` | 1 | Differential-pair channel length |
| `mirror_width` | 10 | Active-load width |
| `mirror_length` | 2 | Active-load channel length |
| `bias_width` | 10 | Bias-diode width |
| `tail_width` | 30 | Tail mirror sizing |
| `bias_length` | 2 | Bias transistor channel length |
| `bias_resistance` | 50 kohm | Bias-current setting |
| `feedback_upper` | 150 kohm | Upper feedback resistance |
| `feedback_lower` | 100 kohm | Lower feedback resistance |
| `output_capacitance` | 900 pF | Output charge storage |
| `miller_capacitance` | 30 pF | Loop compensation |
| `zero_resistance` | 100 ohm | Compensation zero adjustment |

Every named parameter is referenced. Pass strength, bias, compensation, and feedback can be edited independently. Schematic positions retain separated functional groups.

## Validation

### Actual results from submission 1

The host attempted the fixed nominal diagnostics, including the requested tt, 1.8 V, 27 C operating point at 20 mA. No valid operating point was obtained: zero of seven transistors had reported measurements.

All four electrical analyses terminated before simulation. The reported error was `could not find a valid modelname` for the pass transistor, whose expanded model instance had width 6000 and finger count 100. Consequently, no DC regulation, quiescent current, PSR, step, or startup measurements were available. These results establish neither electrical compliance nor an electrical waveform failure.

Asset diagnostics reported:
- Native export successful.
- Native connectivity matched.
- 13 devices.
- 15 parameters with 20 parameter references.
- Explicit layout with no overlaps.

### Revision rationale

The pass device now uses a modest unit width and an explicit parallel multiplier instead of a large width and finger count. This is a model-compatibility correction based on the returned error, not an electrically measured optimization.

The amplifier, divider, bias, and compensation values are otherwise unchanged so that subsequent measurements can characterize the intended topology. The revised circuit has not yet been simulated, and model acceptance is not asserted in advance.

Analytical checks confirm feedback polarity, the nominal divider ratio, and the explicit capacitance budget. None substitutes for electrical diagnostics.

## Limitations

No measured electrical performance is available yet. All original requirements remain unverified, including the 30 mV DC band, 100 microampere no-load input-current limit, PSR thresholds, transient bounds, and startup limits.

The amplifier directly drives the pass bank. Gate slew rate and compensation stability are significant risks. Bias is supply- and process-dependent, and low-supply amplifier headroom needs verification.

There is no dedicated startup clamp, adaptive gate driver, or active output-discharge stage. The divider supplies the no-load discharge path. Startup overshoot and load-release recovery must therefore be measured.

The multiplier changes parasitic scaling relative to the rejected multifinger description; equivalence of dynamic behavior is not claimed. Full PVT testing remains necessary even if the public nominal diagnostics pass. Mismatch and extracted-layout effects are outside this submission's validation.
