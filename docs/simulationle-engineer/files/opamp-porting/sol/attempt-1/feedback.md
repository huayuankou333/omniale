## Simulation results (design attempt 1 of 3)
Your netlist was simulated with the testbenches described in the task (VDD = 1.2 V, TT corner, 27 °C).

| Metric | Requirement | Your design | Met |
|---|---|---|---|
| dc_gain_dB | ≥ 78.4 | 62.61 | no |
| ugf_Hz | ≥ 8.9e+07 | 1.396e+08 | yes |
| pm_deg | ≥ 60 | N/A | no |
| gm_dB | ≥ 10 | N/A | no |
| power_uW | ≤ 296.4 | 252 | yes |
| rise_settle_ns | ≤ 12.24 | 20.91 | no |
| fall_settle_ns | ≤ 26.73 | 0.05 | yes |
| n_triode | ≤ 0 | 0 | yes |

Transistor operating points at DC (voltages in V, currents in µA):
| Device | Type | Id | Vgs | Vds | Vdsat | Saturation margin |
|---|---|---|---|---|---|---|
| m.xdut.xmnref.msky130_fd_pr__nfet_01v8_lvt | n | 20 | 0.573 | 0.573 | 0.107 | 0.467 |
| m.xdut.xmntail.msky130_fd_pr__nfet_01v8_lvt | n | 77.12 | 0.573 | 0.317 | 0.107 | 0.21 |
| m.xdut.xmnbias.msky130_fd_pr__nfet_01v8_lvt | n | 9.945 | 0.573 | 0.571 | 0.107 | 0.464 |
| m.xdut.xmpbias.msky130_fd_pr__pfet_01v8_lvt | p | 9.945 | 0.629 | 0.629 | 0.169 | 0.46 |
| m.xdut.xmnp.msky130_fd_pr__nfet_01v8_lvt | n | 38.75 | 0.583 | 0.144 | 0.094 | 0.05 |
| m.xdut.xmnn.msky130_fd_pr__nfet_01v8_lvt | n | 38.37 | 0.581 | 0.232 | 0.092 | 0.14 |
| m.xdut.xmpd.msky130_fd_pr__pfet_01v8_lvt | p | 38.75 | 0.739 | 0.739 | 0.252 | 0.487 |
| m.xdut.xmpm.msky130_fd_pr__pfet_01v8_lvt | p | 38.37 | 0.739 | 0.65 | 0.252 | 0.398 |
| m.xdut.xmnout.msky130_fd_pr__nfet_01v8_lvt | n | 102.9 | 0.549 | 0.897 | 0.083 | 0.814 |
| m.xdut.xmpout.msky130_fd_pr__pfet_01v8_lvt | p | 102.9 | 0.629 | 0.302 | 0.169 | 0.133 |

Revise the design so that it meets every specification. Reply in the same format: exactly one ```spice
code block containing the complete netlist.
