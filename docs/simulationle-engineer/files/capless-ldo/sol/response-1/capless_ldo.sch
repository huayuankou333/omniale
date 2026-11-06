v {xschem version=3.4.7 file_version=1.2}
G {}
K {}
V {}
S {}
E {}
T {Capless LDO | agent-authored topology and parameters} 0 -80 0 0 0.5 0.5 {}
C {symbols/iopin.sym} 0 0 0 0 {name=p1 lab=vin}
C {symbols/iopin.sym} 180 0 0 0 {name=p2 lab=vout}
C {symbols/iopin.sym} 360 0 0 0 {name=p3 lab=vss}
C {symbols/iopin.sym} 540 0 0 0 {name=p4 lab=vref}
C {symbols/pmos4.sym} 300 300 0 0 {name=BIAS spiceprefix=X model=sky130_fd_pr__pfet_01v8 w=10 l=2 m=1 extra="nf=1"}
C {symbols/lab_pin.sym} 320 330 0 1 {name=l1 lab=pbias}
C {symbols/lab_pin.sym} 280 300 0 0 {name=l2 lab=pbias}
C {symbols/lab_pin.sym} 320 270 0 1 {name=l3 lab=vin}
C {symbols/lab_pin.sym} 320 300 0 1 {name=l4 lab=vin}
T {bias} 250 235 0 0 0.2 0.2 {}
C {symbols/res.sym} 300 660 0 0 {name=RBIAS value=50k m=1}
C {symbols/lab_pin.sym} 300 630 0 1 {name=l5 lab=pbias}
C {symbols/lab_pin.sym} 300 690 0 1 {name=l6 lab=vref}
T {bias} 250 595 0 0 0.2 0.2 {}
C {symbols/pmos4.sym} 900 300 0 0 {name=TAIL spiceprefix=X model=sky130_fd_pr__pfet_01v8 w=30 l=2 m=1 extra="nf=1"}
C {symbols/lab_pin.sym} 920 330 0 1 {name=l7 lab=tail}
C {symbols/lab_pin.sym} 880 300 0 0 {name=l8 lab=pbias}
C {symbols/lab_pin.sym} 920 270 0 1 {name=l9 lab=vin}
C {symbols/lab_pin.sym} 920 300 0 1 {name=l10 lab=vin}
T {amplifier} 850 235 0 0 0.2 0.2 {}
C {symbols/pmos4.sym} 900 660 0 0 {name=INFB spiceprefix=X model=sky130_fd_pr__pfet_01v8 w=100 l=1 m=1 extra="nf=1"}
C {symbols/lab_pin.sym} 920 690 0 1 {name=l11 lab=mirror}
C {symbols/lab_pin.sym} 880 660 0 0 {name=l12 lab=fb}
C {symbols/lab_pin.sym} 920 630 0 1 {name=l13 lab=tail}
C {symbols/lab_pin.sym} 920 660 0 1 {name=l14 lab=vin}
T {amplifier} 850 595 0 0 0.2 0.2 {}
C {symbols/pmos4.sym} 1500 660 0 0 {name=INREF spiceprefix=X model=sky130_fd_pr__pfet_01v8 w=100 l=1 m=1 extra="nf=1"}
C {symbols/lab_pin.sym} 1520 690 0 1 {name=l15 lab=gate}
C {symbols/lab_pin.sym} 1480 660 0 0 {name=l16 lab=vref}
C {symbols/lab_pin.sym} 1520 630 0 1 {name=l17 lab=tail}
C {symbols/lab_pin.sym} 1520 660 0 1 {name=l18 lab=vin}
T {amplifier} 1450 595 0 0 0.2 0.2 {}
C {symbols/nmos4.sym} 900 1020 0 0 {name=MIRROR spiceprefix=X model=sky130_fd_pr__nfet_01v8 w=10 l=2 m=1 extra="nf=1"}
C {symbols/lab_pin.sym} 920 990 0 1 {name=l19 lab=mirror}
C {symbols/lab_pin.sym} 880 1020 0 0 {name=l20 lab=mirror}
C {symbols/lab_pin.sym} 920 1050 0 1 {name=l21 lab=vss}
C {symbols/lab_pin.sym} 920 1020 0 1 {name=l22 lab=vss}
T {amplifier} 850 955 0 0 0.2 0.2 {}
C {symbols/nmos4.sym} 1500 1020 0 0 {name=SINK spiceprefix=X model=sky130_fd_pr__nfet_01v8 w=10 l=2 m=1 extra="nf=1"}
C {symbols/lab_pin.sym} 1520 990 0 1 {name=l23 lab=gate}
C {symbols/lab_pin.sym} 1480 1020 0 0 {name=l24 lab=mirror}
C {symbols/lab_pin.sym} 1520 1050 0 1 {name=l25 lab=vss}
C {symbols/lab_pin.sym} 1520 1020 0 1 {name=l26 lab=vss}
T {amplifier} 1450 955 0 0 0.2 0.2 {}
C {symbols/pmos4.sym} 2400 300 0 0 {name=PASS spiceprefix=X model=sky130_fd_pr__pfet_01v8 w=6000 l=0.5 m=1 extra="nf=100"}
C {symbols/lab_pin.sym} 2420 330 0 1 {name=l27 lab=vout}
C {symbols/lab_pin.sym} 2380 300 0 0 {name=l28 lab=gate}
C {symbols/lab_pin.sym} 2420 270 0 1 {name=l29 lab=vin}
C {symbols/lab_pin.sym} 2420 300 0 1 {name=l30 lab=vin}
T {pass} 2350 235 0 0 0.2 0.2 {}
C {symbols/res.sym} 2100 1020 0 0 {name=RZERO value=100 m=1}
C {symbols/lab_pin.sym} 2100 990 0 1 {name=l31 lab=gate}
C {symbols/lab_pin.sym} 2100 1050 0 1 {name=l32 lab=comp}
T {compensation} 2050 955 0 0 0.2 0.2 {}
C {symbols/capa.sym} 2700 1020 0 0 {name=CMILLER value=30p m=1}
C {symbols/lab_pin.sym} 2700 990 0 1 {name=l33 lab=comp}
C {symbols/lab_pin.sym} 2700 1050 0 1 {name=l34 lab=vout}
T {compensation} 2650 955 0 0 0.2 0.2 {}
C {symbols/capa.sym} 3000 660 0 0 {name=COUT value=900p m=1}
C {symbols/lab_pin.sym} 3000 630 0 1 {name=l35 lab=vout}
C {symbols/lab_pin.sym} 3000 690 0 1 {name=l36 lab=vss}
T {output} 2950 595 0 0 0.2 0.2 {}
C {symbols/res.sym} 3600 300 0 0 {name=RUPPER value=150k m=1}
C {symbols/lab_pin.sym} 3600 270 0 1 {name=l37 lab=vout}
C {symbols/lab_pin.sym} 3600 330 0 1 {name=l38 lab=fb}
T {feedback} 3550 235 0 0 0.2 0.2 {}
C {symbols/res.sym} 3600 660 0 0 {name=RLOWER value=100k m=1}
C {symbols/lab_pin.sym} 3600 630 0 1 {name=l39 lab=fb}
C {symbols/lab_pin.sym} 3600 690 0 1 {name=l40 lab=vss}
T {feedback} 3550 595 0 0 0.2 0.2 {}
