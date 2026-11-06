# Design documentation

## Architecture

This revision addresses the prior operating-point failure: the error-stage output node `drive` is now connected to both the NMOS differential-pair output and the PMOS mirror output, and drives the PMOS pass-device gate. A weak resistor from `vin` to `drive` provides a defined default gate bias rather than leaving that node floating.

The error stage is a simple NMOS differential pair with PMOS mirror load. Its inputs are assigned so that the divider feedback is compared against the 0.4 V reference with the intended negative-feedback sense: `fb` drives one pair input and `vref` the other. The pass device is a high-side PMOS. The resistor divider has a nominal feedback fraction of 0.4 at 1.0 V output. Ideal output and compensation capacitors total 900 pF, within the stated budget.

## Parameters

- `pass_w`, `pass_l`: pass-device geometry; `pass_w` is used with 20 fingers.
- `pair_w`, `pair_l`: differential-pair geometry.
- `mirror_w`: PMOS mirror-load width.
- `tail_w`: differential-pair tail-device width.
- `bias_r`: sets the resistor-fed diode-connected NMOS bias.
- `feedback_top`, `feedback_bottom`: set the output feedback ratio.
- `output_cap`, `comp_cap`: set ideal output and drive-node capacitance.
- `drive_pullup`: sets the weak default bias from the input supply to the pass gate.

## Validation

Attempt 2 exported successfully but exhibited a singular `drive` node, failed to establish a valid regulated operating point, and produced large output excursions. The operating-point report showed the tail device near zero drain-source voltage and the mirror output device effectively off. This revision connects the mirror output and NMOS output to the shared `drive` node and reverses the differential input assignment to correct the apparent feedback direction.

The revised circuit has not been simulated. No DC, PSR, load-step, startup, or PVT performance is claimed.

## Limitations

This is a minimal, uncharacterized transistor-level error amplifier and regulator. Its bias current, gain, output swing, loop stability, compensation, startup behavior, dropout margin, and full-PVT behavior remain unverified. The prior measured output range and PSR results were far outside the original requirements; the wiring changes are intended to address the observed floating-node failure but do not establish compliance. Formal electrical signoff is not claimed.
