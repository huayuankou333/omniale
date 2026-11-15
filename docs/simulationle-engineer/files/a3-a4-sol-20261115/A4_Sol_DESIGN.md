# Architecture

This is a transistor-level, two-stage fully differential OTA and a pair of
continuous-time sensor voltage followers. All active devices are SKY130 MOS
wrappers. No ideal amplifiers, behavioral sources, clock-dependent DUT elements,
or external model definitions are used.

The OTA has a PMOS LVT input pair, cascoded first-stage branches, NMOS
common-source output stages and PMOS current-source output loads. Series RC
Miller networks compensate the differential loop. Equal resistors sense the
output common mode. A PMOS differential error amplifier compares this average
with VOCM and controls the first-stage NMOS loads. Its resistive return goes to
a separately generated replica bias; it does not return into the IREF pin.
Resistor dividers generate the two cascode biases. IREF is diode-terminated and
mirrored internally. Both output stages and the CMFB circuitry draw from VDD.

The interface consists of two PMOS-input, two-stage Miller-compensated unity
followers. A resistor-fed MOS bias network starts internally from VDD. The
sensor terminals only connect to input MOS gates, with finite gate capacitance
and capacitive reverse coupling. They do not connect to sampling clocks or
OTA outputs. Each follower drives the fixed sampling switch and 1 pF capacitor.
There is no intended DC sensor loading, but the input capacitance and transient
loading are not zero.

The fixed cross-coupled capacitors give positive gain for the original
continuous-capacitor test. Charge conservation for sampling a source and then
returning its bottom plate to VOCM instead requires **minus eight** times the
sampled source differential voltage. This sign follows from the capacitor
connections, not a fit to this candidate's outputs.

# Parameters

The actual device instances and dimensions are fully listed in `circuit.spi`;
parallel devices are explicitly instantiated to stay within model width bins.
Important nominal choices are:

* IREF = 50 uA, supplied by the bench from VDD.
* Input pair: PMOS LVT, W/L = 100/0.5 um per side.
* First-stage NMOS loads: W/L = 100/1 um per side.
* First-stage cascodes: PMOS LVT 200/0.35 and NMOS 100/0.3 um.
* Output NMOS: two parallel 160/0.6 um devices per side.
* Output PMOS: fourteen parallel 100/1 um devices per side.
* Differential compensation: 100 ohm in series with 480 fF per side.
* CM sensing: 50 kohm per side; CM control shunt: 50 ohm to replica bias.
* Replica-current trim: nine 100/1 PMOS branches and one 65/1 branch.
* Interface bias feed: 24 kohm. Follower inputs: PMOS LVT 8/0.35 um.
* Follower compensation: 200 ohm and 300 fF per channel.

Dimensions are micrometres with the PDK's scale convention, not SI-valued
SPICE width suffixes. The netlist is a schematic sizing proposal, not an
extracted-layout design.

# Validation

The device checker passes with ideal R and C enabled. Experiments and their
logs are under `/app/experiments`. These are development diagnostics, not
formal acceptance. The complete 341-process acceptance matrix was **not** run.

Final nominal original diagnostic results:

| Quantity | Measured |
|---|---:|
| Return-ratio phase margin | 77.64 degrees |
| Output common-mode error | 0.249 mV |
| VDD quiescent power | 5.447 mW |
| Rise / fall settling | 8.238 / 8.136 ns |
| Rise / fall error at 10 ns, fraction of 0.9 V | 0.003889 / 0.003220 |
| High static error, fraction of 0.9 V | 0.0006682 |
| Low static error, fraction of 0.9 V | 1.25e-8 |
| Differential integrated output noise | 0.9712 mVrms |
| CM pulse peak deviation | 13.25 mV |
| CM residual 20 ns after release | 5.73 uV |
| CM residual 100 ns after release | 0.099 uV |

Exploratory SS/1.8 V/85 C diagnostics gave 77.31 degrees phase margin,
21.75 mV common-mode error, 5.459 mW quiescent power, 9.100/8.969 ns
settling, and **1.060 mVrms noise (over the 1 mVrms limit)**. Exploratory FF
supply/temperature diagnostics were also run, but are not a full PVT matrix.
The finite public DC sweep did not find both 3 dB compression crossings;
therefore no compliant differential output range has been established.
A single public nominal mismatch diagnostic was run, not all twenty samples.

The fixed added platform was generated without changing its fixture or timing.
Both nominal 20 kohm history runs and three representative fixed-acquisition
noise runs were executed for the final circuit. The nominal application
**does not function as a sampling amplifier**: its output common mode reaches
the upper rail during reset and remains trapped there. Differential output is
near zero rather than the commanded sampled value. Full-scale read error is
approximately 0.900 V, and common-mode error approximately 0.900 V. These are
failures, not missing target corrections or acceptable gain calibration.

For those same nominal history runs, observed sensor disturbance maxima were
about 0.1893 mV, absolute source-current-difference integral about 0.00449 fC
per window, and acquisition-tail disturbance about 0.00207 mV. System average
positive power was about 2.950 mW under the specified per-source clipping
calculation. These favorable figures describe the **malfunctioning** operating
state and must not be presented as successful interface-system validation.

Original output noise is integrated from 10 Hz to 10 GHz at the prescribed
closed-loop operating point. Added noise is a different quantity: differential
follower-output noise with fixed acquisition-phase switches, including source
resistance and connected OTA. Neither proves sampled/aliased output noise or
full kT/C performance. Power quoted for the application includes the separately
clipped reference, clock and sensor-source contributions, not merely VDD net
power; the unloaded baseline is excluded.

# Limitations

This delivery is an incomplete solution. The principal unresolved failure is
common-mode startup and recovery when reset ties the OTA input common mode to
its outputs. The PMOS input stage can turn off at high input common mode,
creating a rail equilibrium absent from the original fixed-input-common-mode
benches. Differential loop stability at beta = 1/9 does not establish reset
unity-feedback stability or eliminate that nonlinear equilibrium. Several
attempted startup and compensation alternatives were simulated and rejected;
they are not included in the delivered netlist.

The added read/hold accuracy and transfer settling requirements fail even at
nominal. History equality of two rail-trapped outputs cannot be interpreted as
correct sampling. The output range remains unverified, worst-corner original
noise already exceeds its limit, and the complete mismatch and PVT suites have
not been validated. No claim of task success or of passing all fifteen original
checks or six added groups is made. Layout parasitics, reliability, and
periodically time-varying noise are not characterized.

The three final fixed-acquisition noise measurements were 771.0 uVrms (TT),
837.2 uVrms (SS), and 715.1 uVrms (FF), each with 20 kohm per leg. All three
**fail the added 250 uVrms limit**. Thus even the fixed-phase noise proxy is
not compliant. The single mismatch diagnostic returned common-input
feedthrough -67.506 dB and either-rail feedthrough -79.195 dB; using nominal
closed-loop gain 19.058 dB gives approximately 86.56 dB CMRR and 98.25 dB
PSRR for that one sample only.
