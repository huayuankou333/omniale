Design the circuit from an empty design, using the original electrical specifications below. This is a three-complete-design feedback experiment. You have no file, shell, simulation, or other tools. The host automatically executes the fixed public diagnostic suite after each valid design and returns the measured results and operating point. Original instructions to edit files, inspect paths, or run commands are superseded by this reply-only output contract.

BUDGET: first complete design plus at most two feedback revisions in this same conversation; at most two extra formatting/netlist-policy retries across the whole conversation. A valid circuit that does not converge or fails electrical requirements consumes one design attempt. Every revision must be a complete replacement, never a patch. The last authored submission is used, not the best historical candidate. Formal full-PVT/mismatch scoring occurs only after freezing, and is not returned for revision. Public nominal success is not complete signoff. Do not assert unmeasured performance.

FIXED PUBLIC DIAGNOSTICS:
{
  "conditions": "tt, VDD=1.8 V, 27 C; public mismatch seed=51000",
  "analyses": [
    "loop",
    "settling",
    "noise",
    "ranges",
    "cmfb_recovery",
    "mismatch"
  ],
  "additional_op": "TT per-transistor OP at zero differential input, 50 uA external reference",
  "native_processes_per_design": 7
}

ORIGINAL ELECTRICAL TASK:
# Design a Fully Differential Sampling-Feedback OTA: Gain 8, 10 ns Settling, 1 mVrms Noise

Design a fully differential OTA for a capacitive sampling-feedback load.

## Spec

- The feedback network is `Cs = 8Cf = 1 pF`; each output additionally drives `CL = 250 fF`.
- For a 0.9 V differential output step from 0 V to 0.9 V, the final static error at either commanded level must be <= 1%.
- For the same step, the output error at 10 ns must be <= 1%, and both rising and falling settling times must be <= 10 ns.
- Return-ratio phase margin >= 60 deg.
- The open-loop differential output swing must exceed 1.8 V, measured by sweeping the differential input DC bias and taking the span between the two output levels at which the local DC differential gain `d(voutp-voutn)/d(vinp-vinn)` is 3 dB below its peak.
- Integrated differential output noise <= 1 mVrms from 10 Hz to 10 GHz.
- At 10 Hz, CMRR must be >= 50 dB and PSRR from either rail must be >= 60 dB in every one of 20 fixed-seed nominal local-mismatch samples. The common numerator is the nominal-TT closed-loop differential gain; each mismatch sample measures only common-mode-input, positive-rail, and negative-rail feedthrough to the differential output `voutp-voutn`. These metrics do not measure output common-mode deviation.
- The 30-point matrix contains all combinations of `tt`, `ff`, `ss`, `fs`, and `sf`; 1.80 and 1.98 V; and -25, 27, and 85 C. It covers stability, accuracy, settling, output range, and noise.
- At zero differential input, output common-mode error must be <= 25 mV throughout the 30-point matrix.
- Quiescent VDD power, including reference-bias and common-mode-feedback branches, must not exceed 10 mW throughout the 30-point matrix.
- At nominal, ss/1.80 V/85 C, and ff/1.98 V/-25 C, apply a simultaneous 50 uA sink-current pulse to each output for 20 ns with 100 ps edges. The common-mode deviation from an undisturbed identical instance must be <= 100 mV from pulse onset through 5 ns after release, <= 5 mV at 20 ns after release, and <= 1 mV at 100 ns after release.
- All 20 nominal mismatch rejection samples must converge.

## Deliverable

- Edit `circuit.spi`; keep `.subckt sampling_feedback_ota vss iref vdd vinn vinp vocm voutn voutp`.
- `iref` is the only external analog-bias port. Generate all internal bias voltages and continuous-time output common-mode feedback inside the DUT.
- The published Device Checker accepts SKY130 PDK wrappers and ideal R/C only; it rejects independent, controlled, behavioral, and unknown device forms. It does not inspect topology, device dimensions, passive values, instance names, or bias lineage.
- Read `/opt/analog-arena/SKY130_NETLIST_GUIDE.md` before editing the circuit.

You can preflight the submitted netlist with `/opt/analog-arena/check_circuit.py /app/circuit.spi --allow-ideal R C`. The evaluator runs the same check whether or not you run it yourself.



OUTPUT CONTRACT:
Return exactly one ```spice block containing your complete circuit.spi, including every required subcircuit. A short design explanation outside the block is allowed.

SKY130 DEVICE GUIDE:
# SKY130 netlist reference

This reference lists SKY130 SPICE device syntax, geometry conventions, hierarchy rules, simulation corners, and measurement definitions.

## Model selection

Load the required SKY130 model library in the testbench and select the intended process corner with `.lib`. Keep model loading out of the circuit under test so that the same circuit can be reused with different corners and model installations.

```spice
.lib "/path/to/sky130.lib.spice" tt
```

Use a model set that contains every device instantiated by the circuit. Core CMOS simulations may need only the continuous MOS models, while physical resistors, capacitors, varactors, inductors, BJTs, and specialized devices require their corresponding PDK models.

## MOS devices

The commonly used 1.8 V core and low-threshold MOS wrappers are:

```spice
sky130_fd_pr__nfet_01v8
sky130_fd_pr__pfet_01v8
sky130_fd_pr__nfet_01v8_lvt
sky130_fd_pr__pfet_01v8_lvt
```

The 5.0 V-gate/10.5 V-drain MOS wrappers are:

```spice
sky130_fd_pr__nfet_g5v0d10v5
sky130_fd_pr__pfet_g5v0d10v5
```

Instantiate MOS wrappers as four-terminal subcircuits:

```spice
XMN drain gate source bulk sky130_fd_pr__nfet_01v8 l=0.15 w=0.84 nf=2
XMP drain gate source bulk sky130_fd_pr__pfet_01v8 l=0.15 w=1.68 nf=2
XNHV drain gate source bulk sky130_fd_pr__nfet_g5v0d10v5 l=0.5 w=10 nf=5
XPHV drain gate source bulk sky130_fd_pr__pfet_g5v0d10v5 l=0.5 w=20 nf=5
```

The terminal order is drain, gate, source, bulk.

The SKY130 ngspice model libraries set `scale=1u`; therefore, numeric `l` and `w` values are expressed in micrometres and do not use a `u` suffix.

| Wrapper | Minimum modeled `l` (µm) |
| --- | ---: |
| `sky130_fd_pr__nfet_01v8` | `0.15` |
| `sky130_fd_pr__pfet_01v8` | `0.15` |
| `sky130_fd_pr__nfet_01v8_lvt` | `0.15` |
| `sky130_fd_pr__pfet_01v8_lvt` | `0.35` |
| `sky130_fd_pr__nfet_g5v0d10v5` | `0.50` |
| `sky130_fd_pr__pfet_g5v0d10v5` | `0.50` |

The `w` parameter is total channel width, `nf` is the positive integer number of fingers, and `w/nf` is the width of one finger.

## Subcircuits and hierarchy

Define a subcircuit with `.subckt` and terminate it with `.ends`:

```spice
.subckt example vss ibias vdd vinn vinp vout
* Circuit implementation.
.ends example
```

Nodes listed after the subcircuit name are external terminals. Other nodes are local to the subcircuit, except node `0` and nodes declared with `.global`.

## Passive and RF devices

Ideal passives use ordinary SPICE syntax:

```spice
R1 n1 n2 10k
C1 n2 vss 2p
L1 n3 n4 4n
```

SPICE suffixes are case-insensitive, and `M` means milli rather than mega. Use `meg` for mega.

Use a physical PDK passive when a task requires its process, temperature, voltage, geometry, or mismatch behaviour. Ideal `R` and `C` primitives have none of those layout-dependent PDK effects. A task may still allow ideal passives for an explicitly idealized load, compensation, or test structure; the task instruction and verifier, rather than this general reference, decide whether they are legal.

### Physical resistors

Physical poly-resistor wrappers have three terminals in `r0 r1 sub` order: connect `sub` to the appropriate substrate/reference node (normally `vss` for a low-voltage NMOS process). Set numeric `w` and `l` in micrometres; add a documented multiplier only when the selected wrapper supports it. Typical available choices are `sky130_fd_pr__res_high_po` and `sky130_fd_pr__res_xhigh_po`; use the model required or permitted by the task.

```spice
XRH r0 r1 vss sky130_fd_pr__res_high_po  w=1 l=10
XRX r0 r1 vss sky130_fd_pr__res_xhigh_po w=1 l=10
```

### Physical capacitors and varactors

The two-terminal MIM capacitor uses `c0 c1` order. Set its numeric `w`, `l`, and `mf` geometry parameters in micrometres/units expected by the PDK wrapper:

```spice
XCM c0 c1 sky130_fd_pr__cap_mim_m3_1 w=5 l=5 mf=1
```

Use the wrapper's documented `mf` parameter for physical MIM geometry. Do not
assume that generic SPICE instance `m`, a wrapper parameter named `mult`, and
`mf` are interchangeable: their electrical effect depends on the selected PDK
wrapper and simulator. A task that limits capacitor area must state which
forms it accepts and how it accounts for them. MIM density and corner scaling
are also model-dependent; use the task's stated area-accounting rule rather
than inferring a signoff capacitance from this example.

The low-threshold varactor is a three-terminal device in `c0 c1 b` order; `b` is its body/bias terminal. It accepts `w`, `l`, and `vm`:

```spice
XCV c0 c1 b sky130_fd_pr__cap_var_lvt w=5 l=0.5 vm=1
```

The commonly available SKY130 inductor wrappers are:

```spice
sky130_fd_pr__ind_03_90
sky130_fd_pr__ind_05_125
sky130_fd_pr__ind_05_220
```

These inductors use `a b ct sub` terminal order.

## Testbench organization

The testbench contains model selection, sources, circuit instances, loads, analyses, and measurements.

A directly runnable nominal testbench can use this pattern:

```spice
.lib "/path/to/sky130.lib.spice" tt
.include "circuit.spi"
.param supply=1.8
.param temperature=27
.temp {temperature}
VSS vss 0 0
VDD vdd vss {supply}
* Inputs, circuit instance, load, analysis, and measurements.
.end
```

## Process corners

The standard MOS process-corner sections are `tt`, `ff`, `ss`, `fs`, and `sf`. Supply voltage and temperature are specified independently by circuit sources and `.temp`.

## Monte Carlo simulation

The SKY130 model libraries provide separate sections for global process variation, local mismatch, and deterministic corners.

Common continuous-model modes are:

```spice
* Global process variation.
.option seed=31000
.lib "/path/to/sky130.lib.spice" mc

* Local mismatch around the typical corner.
.option seed=31000
.lib "/path/to/sky130.lib.spice" tt_mm

* Global variation with local mismatch enabled.
.option seed=31000
.lib "/path/to/sky130.lib.spice" mc
.param MC_MM_SWITCH=1
```

Place `.option seed` before `.lib`. The `mc` section enables global process variation, `tt_mm` enables local mismatch at the typical corner, and setting `MC_MM_SWITCH=1` with `mc` enables local mismatch in addition to global process variation.

## Measurements

Transient simulations should define initial state, pulse timing, source impedance, load, maximum step, and stop time. Sampled-data circuits should also define the sampling edge, resolving edge, and output-valid time.

Ordinary `.measure` statements can extract scalar results:

```spice
.measure tran trise TRIG v(vout) VAL=0.18 RISE=1 TARG v(vout) VAL=1.62 RISE=1
.measure tran tfall TRIG v(vout) VAL=1.62 FALL=1 TARG v(vout) VAL=0.18 FALL=1
```

Choose thresholds from the applicable signal range, make sure delay measurements pair edges from the same event, and use a time step fine enough to resolve the quantity being measured.

Measure settling against the commanded or independently known final value rather than the waveform's own tail average when static error is part of the requirement.

Measure kickback with a defined source impedance and sampling network. An ideal zero-ohm voltage source suppresses input disturbance and does not represent realistic kickback.

For AC, noise, and RF simulations, state the bias condition, source and load definitions, feedback condition, metric definition, and frequency or integration range. Voltage gain alone does not establish impedance matching or power transfer.

## Operating-point checks and convergence

MOS operating-point quantities include `gm`, `gds`, `vds`, `vdsat`, `id`, and terminal capacitances. The saturation-margin expression is `|VDS|-|VDSAT|`.

Floating nodes, ideal voltage-source loops, and ideal current-source cut sets can produce a singular operating-point matrix.

## Review checklist

- The top-level subcircuit name and pin order are correct.
- Every device uses the intended model and terminal order.
- Geometry values lie within the selected model's range.
- `w/nf` is the intended per-finger width.
- Physical passives use the documented terminal order and parameter names.
- The selected library section contains every instantiated device model.


PUBLIC DEVELOPMENT DECKS:
Public development deck: tb_cmfb_nominal.spi
```spice
* Public nominal CMFB recovery diagnostic with the specified disturbance.
* Limits: peak deviation <=100 mV, 20 ns residual <=5 mV,
* and 100 ns residual <=1 mV.
.lib "/opt/sky130/continuous/sky130.lib.spice" tt
.include "../circuit.spi"
.options filetype=ascii reltol=2e-4 abstol=1e-12 vntol=1e-8 method=gear
VSS vss 0 0
VDD vdd vss 1.8
IREF vdd iref 50u
IREFR vdd irefr 50u
VOCM vocm vss 0.9
VINP vinp vss 0.9
VINN vinn vss 0.9
XOTA vss iref vdd vinn vinp vocm voutn voutp sampling_feedback_ota
XREF vss irefr vdd vinn vinp vocm routn routp sampling_feedback_ota
CLP voutp vss 250f
CLN voutn vss 250f
CLRP routp vss 250f
CLRN routn vss 250f
IDISTP voutp vss PULSE(0 50u 20n 100p 100p 20n 200n)
IDISTN voutn vss PULSE(0 50u 20n 100p 100p 20n 200n)
.control
tran 20p 150n
let cm_error = abs(0.5*(v(voutp)+v(voutn))-v(vocm))
let cm_deviation = abs(0.5*(v(voutp)+v(voutn))-0.5*(v(routp)+v(routn)))
let cmfb_peak_limit_v = 100m
let cmfb_residual_20ns_limit_v = 5m
let cmfb_residual_100ns_limit_v = 1m
meas tran cmfb_static_error_v find cm_error at=15n
meas tran cmfb_peak_deviation_v max cm_deviation from=20n to=45n
meas tran cmfb_residual_20ns_v find cm_deviation at=60.2n
meas tran cmfb_residual_100ns_v find cm_deviation at=140.2n
print cmfb_static_error_v cmfb_peak_deviation_v cmfb_residual_20ns_v cmfb_residual_100ns_v
print cmfb_peak_limit_v cmfb_residual_20ns_limit_v cmfb_residual_100ns_limit_v
.endc
.end

```

Public development deck: tb_loop_nominal.spi
```spice
* Public nominal return-ratio diagnostic for Cs=1pF, Cf=125fF, CL=250fF.
.lib "/opt/sky130/continuous/sky130.lib.spice" tt
.include "../circuit.spi"
.options filetype=ascii reltol=2e-4 abstol=1e-12 vntol=1e-7
VSS vss 0 0
VDD vdd vss 1.8
IREF vdd iref 50u
VOCM vocm vss 0.9
VINP vinp vss DC 0.9 AC 0.5
VINN vinn vss DC 0.9 AC -0.5
XOTA vss iref vdd vinn vinp vocm voutn voutp sampling_feedback_ota
CLP voutp vss 361.111f
CLN voutn vss 361.111f
.control
op
let output_common_mode_error_v = abs(0.5*(v(voutp)+v(voutn))-v(vocm))
let power_w = -(v(vdd)-v(vss))*i(vdd)
print output_common_mode_error_v
print power_w
ac dec 80 10 100G
let differential_gain = v(voutp)-v(voutn)
let loop_gain = differential_gain*0.111111111111
let closed_loop_differential_response = differential_gain/(1+loop_gain)
let loop_gain_db = vdb(loop_gain)
let loop_phase_deg = 180/pi*cph(loop_gain)
meas ac low_frequency_loop_gain_db find loop_gain_db at=10
meas ac closed_loop_differential_gain_db find vdb(closed_loop_differential_response) at=10
meas ac loop_ugb_hz when loop_gain_db=0 fall=1
meas ac phase_at_ugb_deg find loop_phase_deg when loop_gain_db=0 fall=1
let phase_margin_deg = 180+phase_at_ugb_deg
print phase_margin_deg
.endc
.end

```

Public development deck: tb_mismatch_nominal.spi
```spice
* Public one-seed local-mismatch rejection diagnostic at 10 Hz.
.option seed=51000
.lib "/opt/sky130/continuous/sky130.lib.spice" tt_mm
.include "../circuit.spi"
.options filetype=ascii reltol=2e-4 abstol=1e-12 vntol=1e-8 method=gear
VSS vss 0 DC 0 AC 0
VDD vdd vss DC 1.8 AC 0
IREF vdd iref 50u
VOCM vocm vss 0.9
VDIFF diff vss DC 0 AC 0
VCMTEST cmtest vss DC 0 AC 1
EINP vinp vss value={v(vocm,vss)+v(cmtest,vss)-0.0555555555556*(v(voutp)-v(voutn))+0.5*v(diff,vss)}
EINN vinn vss value={v(vocm,vss)+v(cmtest,vss)+0.0555555555556*(v(voutp)-v(voutn))-0.5*v(diff,vss)}
XOTA vss iref vdd vinn vinp vocm voutn voutp sampling_feedback_ota
CLP voutp vss 361.111f
CLN voutn vss 361.111f
.control
ac lin 1 10 10
let closed_common_response = v(voutp)-v(voutn)
let mc_closed_cm_10_db = vdb(closed_common_response)
print mc_closed_cm_10_db

alter @VCMTEST[acmag] = 0
alter @VDD[acmag] = 1
ac lin 1 10 10
let closed_vdd_response = v(voutp)-v(voutn)
let mc_closed_vdd_10_db = vdb(closed_vdd_response)
print mc_closed_vdd_10_db

alter @VDD[acmag] = -1
alter @VSS[acmag] = 1
ac lin 1 10 10
let closed_vss_response = v(voutp)-v(voutn)
let mc_closed_vss_10_db = vdb(closed_vss_response)
print mc_closed_vss_10_db
.endc
.end

```

Public development deck: tb_noise_nominal.spi
```spice
* Public nominal closed-loop differential output-noise diagnostic.
.lib "/opt/sky130/continuous/sky130.lib.spice" tt
.include "../circuit.spi"
.options filetype=ascii reltol=2e-4 abstol=1e-12 vntol=1e-7
VSS vss 0 0
VDD vdd vss 1.8
IREF vdd iref 50u
VOCM vocm vss 0.9
VNOISE srcp vss DC 0.9 AC 1
VQUIET srcn vss DC 0.9
CSP srcp vinp 1p
CSN srcn vinn 1p
CFP voutn vinp 125f
CFN voutp vinn 125f
LBP vocm vinp 1G
LBN vocm vinn 1G
XOTA vss iref vdd vinn vinp vocm voutn voutp sampling_feedback_ota
CLP voutp vss 250f
CLN voutn vss 250f
.control
noise v(voutp,voutn) VNOISE dec 80 10 10G
let output_noise_vrms = onoise_total
print output_noise_vrms
.endc
.end

```

Public development deck: tb_nominal.spi
```spice
* Public nominal gain-8 sampling-feedback transient.
.lib "/opt/sky130/continuous/sky130.lib.spice" tt
.include "../circuit.spi"
.options reltol=2e-4
VSS vss 0 0
VDD vdd vss 1.8
IREF vdd iref 50u
VOCM vocm vss 0.9
VSIGP srcp vss PULSE(0.9 0.95625 25n 50p 50p 40n 100n)
VSIGN srcn vss PULSE(0.9 0.84375 25n 50p 50p 40n 100n)
CSP srcp vinp 1p
CSN srcn vinn 1p
CFP voutn vinp 125f
CFN voutp vinn 125f
LBP vocm vinp 1G
LBN vocm vinn 1G
XOTA vss iref vdd vinn vinp vocm voutn voutp sampling_feedback_ota
CLP voutp vss 250f
CLN voutn vss 250f
.control
tran 10p 105n
let differential_output = v(voutp)-v(voutn)
let rise_error = abs(differential_output-0.9)
let fall_error = abs(differential_output)
meas tran rise_tolerance_cross when rise_error=9m cross=last from=25n to=64n
meas tran fall_tolerance_cross when fall_error=9m cross=last from=65n to=105n
meas tran rise_output_at_10ns find differential_output at=35n
meas tran fall_output_at_10ns find differential_output at=75n
meas tran high_static_output find differential_output at=64n
meas tran low_static_output find differential_output at=104n
let rise_settling_time_s = rise_tolerance_cross-25n
let fall_settling_time_s = fall_tolerance_cross-65n
let rise_dynamic_error_fraction = abs(rise_output_at_10ns-0.9)/0.9
let fall_dynamic_error_fraction = abs(fall_output_at_10ns)/0.9
let high_static_error_fraction = abs(high_static_output-0.9)/0.9
let low_static_error_fraction = abs(low_static_output)/0.9
print rise_settling_time_s fall_settling_time_s
print rise_dynamic_error_fraction fall_dynamic_error_fraction
print high_static_error_fraction low_static_error_fraction
.endc
.end

```

Public development deck: tb_range_nominal.spi
```spice
* Public nominal 3 dB-compression differential output-range diagnostic.
.lib "/opt/sky130/continuous/sky130.lib.spice" tt
.include "../circuit.spi"
.options filetype=ascii reltol=2e-4 abstol=1e-12 vntol=1e-10
VSS vss 0 0
VDD vdd vss 1.8
IREF vdd iref 50u
VOCM vocm vss 0.9
VID vid vss 0
EINP vinp vss value={0.9+0.5*v(vid)}
EINN vinn vss value={0.9-0.5*v(vid)}
XOTA vss iref vdd vinn vinp vocm voutn voutp sampling_feedback_ota
CLP voutp vss 250f
CLN voutn vss 250f
.control
set noaskquit
dc VID -20u 20u 500n
let differential_output = v(voutp)-v(voutn)
let local_gain = deriv(differential_output)
let local_gain_db = db(local_gain)
meas dc open_loop_gain_peak_db max local_gain_db
let gain_3db_db = open_loop_gain_peak_db-3
meas dc output_range_min_v find differential_output when local_gain_db=$&gain_3db_db rise=1
meas dc output_range_max_v find differential_output when local_gain_db=$&gain_3db_db fall=1
let differential_range_v = output_range_max_v-output_range_min_v
print open_loop_gain_peak_db gain_3db_db output_range_min_v output_range_max_v differential_range_v
.endc
.end

```