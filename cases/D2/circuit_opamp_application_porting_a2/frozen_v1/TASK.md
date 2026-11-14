# A2: low-voltage op-amp migration with sensor application regression

Port and redesign the supplied 1.8 V TSMC source op-amp for a 1.2 V SKY130 sensor interface. All eight original AnalogPortBench requirements remain mandatory. The same DUT must also preserve the explicitly specified application transfer functions, precision, recovery and power limits below across the application matrix.

Implement `.subckt dut iref inp inn out` in `/app/circuit.spi`. Read `/app/ORIGINAL_TASK.md` for the complete source design, original device rules, original test conditions and eight thresholds. The starting circuit is a mechanical device translation of that source; it is not a working solution. You may redesign topology, sizes, bias and compensation. Application resistors, sources, feedback connections and timing are fixed by the evaluator and cannot be changed in your submission. Submit the last circuit on disk and call `finish`; this file interface supersedes the original prompt's code-block output format.

## Original requirements: mandatory and unchanged

The pinned original scorer and testbenches are run independently on your frozen circuit, with the original numerical settings. TT, 27 C, VDD=1.2 V, VCM=0.9 V, a 20 uA reference from VDD and a 1 pF load are unchanged. The original Middlebrook double-injection loop test and 0.8-to-1.0 V follower transient with 10 ps edges are unchanged.

| Original metric | Requirement |
|---|---|
| DC gain | >=78.4 dB |
| Unity-gain frequency | >=89 MHz |
| Phase margin | >=60 degrees |
| Gain margin | >=10 dB |
| DC power including bias | <=296.4 uW |
| Rising 1% settling | <=12.24 ns |
| Falling 1% settling | <=26.73 ns |
| Transistors in triode at the original DC point | 0 |

Use only SKY130 `nfet_01v8_lvt` and `pfet_01v8_lvt` devices, X-prefix instances with D/G/S/B ports, numeric W/L in micrometres and nf=1. Minimum W is 0.42, minimum L is 0.15 for N and 0.35 for P. Ideal passive R/C elements are allowed. All original syntax and bias-reference restrictions apply. No sources, behavioral devices, models, simulator directives or external bias supplies may be embedded in the DUT. The 20 uA reference must be mirrored. Direct input-to-output feedthrough is not an allowed replacement for amplification.

The original task supplies a TSMC source netlist and its reported source metrics, but not the proprietary TSMC models. This case does not claim a new simulation of that source process. The added application functions and limits are explicitly declared engineering requirements; their feasibility is checked using the target process before this case is frozen.

## Fixed sensor applications

Both applications use VDD=1.2 V and the same 20 uA reference. The sensor source drives inp through 10 kohm. A 20 ohm interconnect joins DUT out to the remote load node `sensed`. A 50 kohm resistive load connects sensed to an ideal 0.75 V application reference, and the specified load capacitor connects sensed to ground. Feedback senses this remote node. The application reference is external to the DUT and is not a new DUT supply pin.

- Gain 1: inn connects to sensed through a 1 milliohm connection model. Input source range is 0.70-1.00 V. The required remote output is the source voltage.
- Gain 4: Rf=30 kohm connects sensed to inn; Rg=10 kohm connects inn to the 0.75 V reference. Input source range is 0.625-0.825 V. Required remote output is `4*Vsensor - 3*0.75 V`, spanning 0.25-1.05 V.

One unchanged DUT must meet both interfaces at every combination of corners TT/SS/FF, temperatures -20/27/85 C and load capacitances 1/3/6 pF. There are 54 tracking cases. The sensor resistance, interconnect resistance and resistive load remain present in every case.

For each case, the evaluator sweeps 41 evenly spaced sensor values across the range. Remote output absolute error must be <=1 mV against the specified transfer function. Each input pin's absolute DC current must be <=1 nA. VDD power including reference bias must be <=296.4 uW at every sweep point. The sum of positive power delivered by VDD, the 0.75 V reference and the sensor source must be <=320 uW; returned energy is not credited against another source's delivered power.

For tracking, the input starts at the low endpoint, rises over 200-201 ns, falls over 501-502 ns, rises again over 800-801 ns and falls over 1101-1102 ns. Each edge is linear over 1 ns. The simulation lasts 1.4 us. Each transition must enter and remain within +/-1 mV of its specified ideal output within 120 ns after the input edge ends. Evaluate through 490/790/1090/1390 ns respectively. Output overshoot in the direction of each step must be <=25% of the ideal output step. The final 20 ns of each window must remain within +/-1 mV of the ideal output and have <=0.2 mV peak-to-peak ripple. Settling to the circuit's own incorrect final level does not pass.

## Overload recovery

At every one of the nine corner/temperature combinations, test gain 4 with CL=6 pF and the same source, interconnect and resistive load. The input starts at 0.725 V (ideal output 0.65 V), rises over 200-201 ns to 0.95 V, returns over 300-301 ns to 0.725 V, falls over 600-601 ns to 0.50 V and returns over 700-701 ns to 0.725 V. The overdrive levels intentionally demand outputs beyond the supply rails; precise tracking is not required while overloaded.

After each return edge ends, the remote output must enter and stay within 1 mV of 0.65 V within 120 ns, without reset or any change to the DUT. Recovery windows end at 590 ns and 990 ns. Each window's last 20 ns must also satisfy the 1 mV error and 0.2 mV ripple limits. Both high-side and low-side overloads must recover.

Added application simulations use single-threaded ngspice Gear order 2, maximum timestep 100 ps and reltol=1e-4, with the pinned SKY130 models. These settings apply only to the new tests; the original verifier's settings remain unchanged. Exact requirements are also recorded in `/app/contract.json`. Public examples under `/app/testbench` are development aids. Final evaluation rebuilds its own benches and never reads your analysis results.

## Development and grading

You have a persistent isolated shell, Python, NumPy, matplotlib and native ngspice through an audited gateway. Choose your own experiments under `/app/experiments`. The budget is 48 model responses, 120 tool calls, 160 native ngspice batch invocations, 131072 cumulative output tokens, 32768 output tokens per response and 7200 seconds wall time including API waits; reasoning effort is medium. Each container has two CPUs and 2 GiB memory. A shell batch consumes one simulation count for each native invocation. There is no three-circuit limit. Circuit definitions must stay in `/app/circuit.spi`; in-process DUT changes cannot bypass counting.

The last submitted file is frozen before independent grading; no historical best is selected. The reference design, final verifier and internet are unavailable to the agent. Final verification is outside the development budget and runs only after freezing. It comprises the two original native invocations and 63 application invocations.

Original grading remains P/F/D/I. FullPass requires original P and all five new groups: application range/loading, application power, application tracking, application stability and overload recovery. The adapted SpecScore is `100*min(original passed checks/8, passed application groups/5)`. This auxiliary percentage is specific to A2, not a replacement for the original benchmark outcome. Simulation or policy failures are reported separately and cannot count as a valid FullPass.
