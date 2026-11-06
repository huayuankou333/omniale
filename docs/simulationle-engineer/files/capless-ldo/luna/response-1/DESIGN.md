# Design documentation

## Architecture

This is a first-pass, flat LDO concept using a high-side PMOS pass device. A PMOS common-source device and an NMOS current sink form a simple error stage driving the pass gate. The output divider produces a nominal feedback fraction of 0.4 when the output is 1.0 V. Ideal output and compensation capacitors are included within the stated total capacitance budget.

This topology is an unverified starting point, not a demonstrated regulator. In particular, the error stage is not a characterized high-gain error amplifier, and the circuit may not establish the intended feedback polarity or operating point across the stated conditions.

## Parameters

- `pass_w` and `pass_l` set the pass-device geometry.
- `amp_w` and `amp_l` set the PMOS error-stage geometry.
- `bias_r` sets the resistor-fed diode-connected NMOS bias.
- `feedback_top` and `feedback_bottom` set the nominal output-divider ratio.
- `output_cap` and `comp_cap` set the ideal output and drive-node capacitances. Their total is 900 pF, below the 1 nF allowance.

## Validation

No simulator or other execution tool was available during authoring. No operating points, DC sweeps, PSR analyses, load steps, startup runs, or corner conditions have been tested. No performance results are claimed.

## Limitations

The simple error stage has no differential comparison against the reference: the reference pin is not used, so the output is not actually regulated to the specified 1.0 V target. Its bias and loop stability are also unverified. Consequently, this submission should be expected to fail electrical requirements and is not suitable for signoff. A complete redesign needs a reference-connected error amplifier, verified loop polarity and gain, and measured behavior across the required PVT and transient conditions.
