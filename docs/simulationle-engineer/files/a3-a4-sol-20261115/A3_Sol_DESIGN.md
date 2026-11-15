# Architecture

The DUT is a PMOS-pass voltage-mode LDO. All bias, feedback and compensation are internal. The reference interface is the insulated gate of the LVT PMOS differential front end, not a separate voltage-follower amplifier. This high-impedance front end provides reference-port isolation without a reference-powered bias branch or a DC reference load. There is no independent source or external bias in the DUT. This is an impedance-isolating amplifier input, not a claim of a separately regulated, low-impedance replica of VREF.

The input pair compares VREF with the 0.4-ratio feedback tap. Its NMOS mirror converts the differential current to a single-ended error voltage. A common-source NMOS gate driver with a PMOS current-source pull-up drives the PMOS pass device. A resistor between the error node and the mirror's diode node limits first-stage impedance and gain; this removes the otherwise troublesome high-impedance third pole. The driver and first-stage mirror have matched nominal W/L ratios and scaled bias currents to reduce the resistor-induced input offset.

The 900 pF output capacitor and a 60 pF gate-to-output compensation capacitor with a 2 kohm series resistor are inside the DUT. The series resistor adds damping/phase lead. The feedback divider also provides a minimum output load, important for hot-corner pass-device leakage. Startup uses the ordinary feedback loop and supply-derived bias; there is no ideal initial condition, timed switch, or explicit soft-start source.

# Parameters

All dimensions below are micrometres; all MOS bulk connections and multiplicities are explicit in `circuit.spi`.

- Pass PMOS: standard 1.8 V, L=0.15, W=10, m=300 (effective W=3000).
- Input pair: LVT PMOS, each L=1, W=10, m=8.
- Input tail: standard PMOS, L=4, W=96.
- Mirror NMOS devices: L=4, W=24 each.
- Gate-driver NMOS: L=4, W=120; PMOS pull-up: L=4, W=240.
- Bias resistor: 330 kohm. Bias NMOS devices: L=2, W=4; diode PMOS: L=4, W=24.
- Error-node shunt feedback resistor: 100 kohm.
- Final output divider: 30 kohm upper, 20 kohm lower. Nominal output load from this divider is 20 uA at 1 V, and nominal closed-loop target is 2.5 × VREF.
- Ideal capacitor total: **960 pF**, with no capacitor multiplicities or helper subcircuits.

The divider, bias and driver consume the DUT's supply budget; reference current is not used as a free bias source. The fixed reference's approximately 18 uA consumption is included in application power calculations. The final measured hot FF DC case has maximum total overhead 94.0921 uA, below 100 uA, but this is not a complete final-design power-matrix certification.

# Validation

160 native ngspice development invocations were used, including unsuccessful early experiments. No formal evaluation was run. The allowed-device netlist checker passes the final file. Generated application benches and unchanged fixture were used with each bench directory as cwd. Experiments and logs are under `/app/experiments`.

## Final frozen electrical design

The final divider revision was tested in **one complete DC sweep, 23 of the 30 application load-step cases, and all four application startup cases**. No electrical changes followed these tests.

| Final-design measurement | Observed result |
|---|---|
| FF / 1.8 V / 85 C, 201-point DC sweep, 0–20 mA | VOUT 1.001256–1.015567 V |
| Same DC sweep, total positive supply overhead | maximum 94.0921 uA equivalent at VIN |
| 23 tested load steps, largest excursion error | 118.925 mV, FS / 1.5 V / 85 C, falling-load window |
| 23 tested load steps, largest recovery-window error | 2.381 mV |
| 23 tested load steps, largest reference deviation | 32.067 uV |
| 23 tested load steps, largest absolute DUT reference-port current | 11.076 nA |
| 23 tested load steps, largest mean positive-supply overhead | 94.6843 uA equivalent at VIN |
| Four startup cases, largest peak | 1.003813 V, FS / 1.8 V / 85 C |
| Four startup cases, largest 200–400 us output error | 2.3804 mV |
| Four startup cases, reference tail deviation | approximately 4 nV |

Recorded final startup positive-supply energies are 0.357338 uJ (TT / 1.8 V / 27 C), 0.278932 uJ (SF / 1.5 V / -40 C), 0.360647 uJ (FS / 1.8 V / 85 C), and 0.288579 uJ (SS / 1.5 V / 85 C). These are diagnostic records, with no startup-energy threshold claimed.

The 23 step cases cover all corners and both supplies. The seven **untested final-design step cases** are TT at both supplies at -40 and 85 C, SS at both supplies at 27 C, and FF / 1.8 V / 27 C. Transient maxima are sampled at the prescribed 5 ns maximum step; no half-step sensitivity rerun was performed. They are development measurements, not formal acceptance certificates.

## Immediately preceding divider revision

The previous revision differed **only** in the divider: 60 kohm / 40 kohm instead of 30 kohm / 20 kohm. Its complete 34 application DC sweeps, 10 application PSR cases, and four application startups were simulated. These results must not be represented as full final-design matrix coverage.

- DC tracking at VREF=0.39 and 0.41 V followed 0.975 and 1.025 V, respectively; maximum trim-sweep target error was 1.8171 mV.
- Across the 30 nominal-reference DC sweeps, one case failed: FF / 1.8 V / 85 C reached **1.044007 V at zero load**. All other nominal-reference cases stayed in the 30 mV band. Doubling the divider load in the final design corrected the measured failing case to 1.015567 V maximum.
- DC reference deviation was about 4 nV at nominal reference, and DC port current was numerically zero. The printed trim diagnostic in `dc15_matrix.log` subtracts 0.4 V even for trim cases; those printed 10 mV values are **not** reference-command errors. Compare trimmed waveforms to their respective commands instead.
- Total DC supply overhead across that revision's matrix peaked at 84.740 uA. The final extra divider load is approximately 10 uA, but the full final matrix was not rerun.
- PSR over all ten application cases: 1 kHz minimum **49.540 dB**, 100 kHz minimum **23.506 dB**, 1 MHz minimum **4.908 dB**. Thus the first two frequencies met their thresholds in that revision, but the 1 MHz group failed. The final divider revision was not AC-simulated.
- Original ideal-reference TT / 1.65 V development diagnostics for that preceding revision measured IQ=56.064 uA; VOUT=1.00052–1.00172 V over DC load; step minimum 0.93713 V and maximum 1.07564 V; startup peak 1.00911 V. Those are nominal development diagnostics, not the original full-PVT acceptance suite.

# Limitations

**This is not an all-specifications-passing submission.** The measured 1 MHz PSR limitation remains unresolved; no claim is made that the small final divider change fixes it. Full final-design DC/trim, PSR, ideal-reference acceptance and load-step matrices were not completed. Formal original/application group outcomes and a score are therefore not claimed.

Early candidates exhibited substantial startup overshoot, low-load oscillation, poor supply rejection and large load-step excursions. Using LVT input PMOS devices fixed a measured cold/low-supply headroom problem; resistive local feedback and series compensation damping fixed the observed sustained low-load oscillations. The hot no-load failure in the preceding revision and its measured final correction are reported above rather than omitted.

There is no separately buffered reference-voltage output inside the DUT; reference isolation relies on the differential stage's MOS gate input. Reference-port performance is supported by the reported simulations, not by a guaranteed physical input-impedance, mismatch or noise model. Capacitor density, layout parasitics, mismatch, noise, reliability signoff and extracted stability are outside these experiments. No loop-break phase-margin result is claimed.
