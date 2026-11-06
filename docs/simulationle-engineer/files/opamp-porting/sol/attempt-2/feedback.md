## Simulation results (design attempt 2 of 3)
Your netlist was simulated with the testbenches described in the task (VDD = 1.2 V, TT corner, 27 °C).

| Metric | Requirement | Your design | Met |
|---|---|---|---|
| dc_gain_dB | ≥ 78.4 | 66.35 | no |
| ugf_Hz | ≥ 8.9e+07 | 3.259e+07 | no |
| pm_deg | ≥ 60 | -8.1 | no |
| gm_dB | ≥ 10 | -2.8 | no |
| power_uW | ≤ 296.4 | 256.7 | yes |
| rise_settle_ns | ≤ 12.24 | 48.54 | no |
| fall_settle_ns | ≤ 26.73 | 49.92 | no |
| n_triode | ≤ 0 | 0 | yes |

Transistor operating points at DC (voltages in V, currents in µA):
| Device | Type | Id | Vgs | Vds | Vdsat | Saturation margin |
|---|---|---|---|---|---|---|
| m.xdut.xmnref.msky130_fd_pr__nfet_01v8_lvt | n | 20 | 0.573 | 0.573 | 0.107 | 0.467 |
| m.xdut.xmntail.msky130_fd_pr__nfet_01v8_lvt | n | 77.37 | 0.573 | 0.332 | 0.107 | 0.226 |
| m.xdut.xmnbias.msky130_fd_pr__nfet_01v8_lvt | n | 9.917 | 0.573 | 0.554 | 0.107 | 0.447 |
| m.xdut.xmpbias.msky130_fd_pr__pfet_01v8_lvt | p | 9.917 | 0.646 | 0.646 | 0.173 | 0.473 |
| m.xdut.xmnn.msky130_fd_pr__nfet_01v8_lvt | n | 38.75 | 0.569 | 0.118 | 0.095 | 0.023 |
| m.xdut.xmnp.msky130_fd_pr__nfet_01v8_lvt | n | 38.62 | 0.567 | 0.163 | 0.093 | 0.069 |
| m.xdut.xmpd.msky130_fd_pr__pfet_01v8_lvt | p | 38.75 | 0.749 | 0.749 | 0.263 | 0.486 |
| m.xdut.xmpm.msky130_fd_pr__pfet_01v8_lvt | p | 38.62 | 0.749 | 0.704 | 0.263 | 0.441 |
| m.xdut.xmnout.msky130_fd_pr__nfet_01v8_lvt | n | 106.6 | 0.495 | 0.902 | 0.084 | 0.818 |
| m.xdut.xmpout.msky130_fd_pr__pfet_01v8_lvt | p | 106.6 | 0.646 | 0.298 | 0.173 | 0.125 |

Revise the design so that it meets every specification. Reply in the same format: exactly one ```spice
code block containing the complete netlist.
