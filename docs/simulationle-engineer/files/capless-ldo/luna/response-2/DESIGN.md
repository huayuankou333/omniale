# Design documentation

## Architecture

The circuit is a reference-connected, PMOS-pass LDO concept. A resistor-fed diode-connected NMOS supplies a simple tail-current bias. An NMOS differential pair compares `vref` against the divided output `fb`; a PMOS current-mirror load converts the differential signal to the pass-gate drive node. The PMOS pass transistor connects `vin` to `vout`.

The divider uses 150 kÎ© over 100 kÎ©, so its nominal feedback fraction is 0.4. Ideal capacitors provide output storage and drive-node compensation, totaling 900 pF.

## Parameters

- `pass_w`, `pass_l`: pass-device geometry. `pass_w` is per-finger width with `nf=20`.
- `pair_w`, `pair_l`: input differential-pair geometry.
- `mirror_w`: PMOS active-load geometry.
- `tail_w`: tail-current transistor width.
- `bias_r`: resistor-fed bias current control.
- `feedback_top`, `feedback_bottom`: output-divider ratio.
- `output_cap`, `comp_cap`: output and drive-node capacitance.

## Validation

Revision 1 failed before simulation because the pass-device instance was rejected as having no valid model name. The reported netlist used a 1200 Âµm device width. This revision reduces the pass-device width parameter to 100 Âµm while retaining 20 fingers, and adds a reference-connected differential input stage. No revised simulations or operating points are available yet; DC, PSR, transient, startup, and PVT performance are unverified.

## Limitations

This is an uncharacterized minimal amplifier and bias implementation, not a proven LDO. Its loop gain, polarity, startup behavior, bias sufficiency, dropout margin, and stability have not been measured. The very large pass device and ideal capacitors are conceptual choices subject to simulation and physical implementation review. No full-PVT or signoff claims are made.
