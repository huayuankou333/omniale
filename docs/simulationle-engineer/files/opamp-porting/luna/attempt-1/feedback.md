## Simulation results (design attempt 1 of 3)
Your netlist was simulated with the testbenches described in the task (VDD = 1.2 V, TT corner, 27 °C).

| Metric | Requirement | Your design | Met |
|---|---|---|---|
| dc_gain_dB | ≥ 78.4 | 37.14 | no |
| ugf_Hz | ≥ 8.9e+07 | 8.669e+06 | no |
| pm_deg | ≥ 60 | 90.7 | yes |
| gm_dB | ≥ 10 | 45.8 | yes |
| power_uW | ≤ 296.4 | 221.7 | yes |
| rise_settle_ns | ≤ 12.24 | 48.63 | no |
| fall_settle_ns | ≤ 26.73 | 48.24 | no |
| n_triode | ≤ 0 | 4 | no |

Transistor operating points at DC (voltages in V, currents in µA):
| Device | Type | Id | Vgs | Vds | Vdsat | Saturation margin |
|---|---|---|---|---|---|---|
| m.xdut.xmnref.msky130_fd_pr__nfet_01v8_lvt | n | 20 | 0.762 | 0.761 | 0.235 | 0.526 |
| m.xdut.xmtail.msky130_fd_pr__nfet_01v8_lvt | n | 0 | 0.762 | 0 | 0.233 | -0.233 |
| m.xdut.xm2bias.msky130_fd_pr__nfet_01v8_lvt | n | 18.93 | 0.762 | 0.336 | 0.235 | 0.101 |
| m.xdut.xmpref.msky130_fd_pr__pfet_01v8_lvt | p | 18.93 | 0.862 | 0.861 | 0.353 | 0.508 |
| m.xdut.xmtaildev.msky130_fd_pr__nfet_01v8_lvt | n | 86.8 | 0.899 | 0.114 | 0.318 | -0.204 |
| m.xdut.xm1.msky130_fd_pr__nfet_01v8_lvt | n | 44.13 | 0.828 | 0.185 | 0.266 | -0.081 |
| m.xdut.xm2.msky130_fd_pr__nfet_01v8_lvt | n | 42.68 | 0.784 | 0.508 | 0.237 | 0.271 |
| m.xdut.xmp1.msky130_fd_pr__pfet_01v8_lvt | p | 44.13 | 0.896 | 0.895 | 0.374 | 0.521 |
| m.xdut.xmp2.msky130_fd_pr__pfet_01v8_lvt | p | 42.68 | 0.896 | 0.573 | 0.374 | 0.199 |
| m.xdut.xmnout.msky130_fd_pr__nfet_01v8_lvt | n | 59.05 | 0.624 | 0.944 | 0.122 | 0.822 |
| m.xdut.xmpload.msky130_fd_pr__pfet_01v8_lvt | p | 59.05 | 0.862 | 0.254 | 0.347 | -0.093 |

Revise the design so that it meets every specification. Reply in the same format: exactly one ```spice
code block containing the complete netlist.
