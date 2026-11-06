## Simulation results (design attempt 2 of 3)
Your netlist was simulated with the testbenches described in the task (VDD = 1.2 V, TT corner, 27 °C).

| Metric | Requirement | Your design | Met |
|---|---|---|---|
| dc_gain_dB | ≥ 78.4 | 52.84 | no |
| ugf_Hz | ≥ 8.9e+07 | 2.69e+07 | no |
| pm_deg | ≥ 60 | 52 | no |
| gm_dB | ≥ 10 | 11 | yes |
| power_uW | ≤ 296.4 | 141.2 | yes |
| rise_settle_ns | ≤ 12.24 | 42.91 | no |
| fall_settle_ns | ≤ 26.73 | 35.69 | no |
| n_triode | ≤ 0 | 1 | no |

Transistor operating points at DC (voltages in V, currents in µA):
| Device | Type | Id | Vgs | Vds | Vdsat | Saturation margin |
|---|---|---|---|---|---|---|
| m.xdut.xmnref.msky130_fd_pr__nfet_01v8_lvt | n | 20 | 0.762 | 0.761 | 0.235 | 0.526 |
| m.xdut.xmtail.msky130_fd_pr__nfet_01v8_lvt | n | 38.3 | 0.762 | 0.239 | 0.232 | 0.007 |
| m.xdut.xmnbias.msky130_fd_pr__nfet_01v8_lvt | n | 18.93 | 0.762 | 0.336 | 0.235 | 0.101 |
| m.xdut.xmpbias.msky130_fd_pr__pfet_01v8_lvt | p | 18.93 | 0.862 | 0.861 | 0.353 | 0.508 |
| m.xdut.xmn1.msky130_fd_pr__nfet_01v8_lvt | n | 19.25 | 0.663 | 0.233 | 0.152 | 0.081 |
| m.xdut.xmn2.msky130_fd_pr__nfet_01v8_lvt | n | 19.05 | 0.659 | 0.359 | 0.149 | 0.21 |
| m.xdut.xmp1.msky130_fd_pr__pfet_01v8_lvt | p | 19.25 | 0.726 | 0.725 | 0.245 | 0.481 |
| m.xdut.xmp2.msky130_fd_pr__pfet_01v8_lvt | p | 19.05 | 0.726 | 0.599 | 0.245 | 0.355 |
| m.xdut.xmnout.msky130_fd_pr__nfet_01v8_lvt | n | 40.45 | 0.6 | 0.903 | 0.124 | 0.78 |
| m.xdut.xmpload.msky130_fd_pr__pfet_01v8_lvt | p | 40.45 | 0.863 | 0.295 | 0.352 | -0.057 |

Revise the design so that it meets every specification. Reply in the same format: exactly one ```spice
code block containing the complete netlist.
