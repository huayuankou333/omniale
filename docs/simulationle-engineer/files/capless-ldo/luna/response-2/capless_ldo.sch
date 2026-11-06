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
C {symbols/pmos4.sym} 1200 400 0 0 {name=PASS spiceprefix=X model=sky130_fd_pr__pfet_01v8 w=100 l=1 m=1 extra="nf=20"}
C {symbols/lab_pin.sym} 1220 430 0 1 {name=l1 lab=vout}
C {symbols/lab_pin.sym} 1180 400 0 0 {name=l2 lab=drive}
C {symbols/lab_pin.sym} 1220 370 0 1 {name=l3 lab=vin}
C {symbols/lab_pin.sym} 1220 400 0 1 {name=l4 lab=vin}
T {pass_stage} 1150 335 0 0 0.2 0.2 {}
C {symbols/res.sym} 300 700 0 0 {name=RBIAS value=100k m=1}
C {symbols/lab_pin.sym} 300 670 0 1 {name=l5 lab=vin}
C {symbols/lab_pin.sym} 300 730 0 1 {name=l6 lab=bias}
T {bias} 250 635 0 0 0.2 0.2 {}
C {symbols/nmos4.sym} 600 700 0 0 {name=BIAS spiceprefix=X model=sky130_fd_pr__nfet_01v8 w=8 l=1 m=1 extra="nf=1"}
C {symbols/lab_pin.sym} 620 670 0 1 {name=l7 lab=bias}
C {symbols/lab_pin.sym} 580 700 0 0 {name=l8 lab=bias}
C {symbols/lab_pin.sym} 620 730 0 1 {name=l9 lab=vss}
C {symbols/lab_pin.sym} 620 700 0 1 {name=l10 lab=vss}
T {bias} 550 635 0 0 0.2 0.2 {}
C {symbols/nmos4.sym} 900 1000 0 0 {name=TAIL spiceprefix=X model=sky130_fd_pr__nfet_01v8 w=8 l=1 m=1 extra="nf=1"}
C {symbols/lab_pin.sym} 920 970 0 1 {name=l11 lab=tail}
C {symbols/lab_pin.sym} 880 1000 0 0 {name=l12 lab=bias}
C {symbols/lab_pin.sym} 920 1030 0 1 {name=l13 lab=vss}
C {symbols/lab_pin.sym} 920 1000 0 1 {name=l14 lab=vss}
T {error_amplifier} 850 935 0 0 0.2 0.2 {}
C {symbols/nmos4.sym} 1200 1000 0 0 {name=INP spiceprefix=X model=sky130_fd_pr__nfet_01v8 w=12 l=1 m=1 extra="nf=1"}
C {symbols/lab_pin.sym} 1220 970 0 1 {name=l15 lab=left}
C {symbols/lab_pin.sym} 1180 1000 0 0 {name=l16 lab=vref}
C {symbols/lab_pin.sym} 1220 1030 0 1 {name=l17 lab=tail}
C {symbols/lab_pin.sym} 1220 1000 0 1 {name=l18 lab=vss}
T {error_amplifier} 1150 935 0 0 0.2 0.2 {}
C {symbols/nmos4.sym} 1500 1000 0 0 {name=INM spiceprefix=X model=sky130_fd_pr__nfet_01v8 w=12 l=1 m=1 extra="nf=1"}
C {symbols/lab_pin.sym} 1520 970 0 1 {name=l19 lab=right}
C {symbols/lab_pin.sym} 1480 1000 0 0 {name=l20 lab=fb}
C {symbols/lab_pin.sym} 1520 1030 0 1 {name=l21 lab=tail}
C {symbols/lab_pin.sym} 1520 1000 0 1 {name=l22 lab=vss}
T {error_amplifier} 1450 935 0 0 0.2 0.2 {}
C {symbols/pmos4.sym} 1800 1000 0 0 {name=MP1 spiceprefix=X model=sky130_fd_pr__pfet_01v8 w=12 l=1 m=1 extra="nf=1"}
C {symbols/lab_pin.sym} 1820 1030 0 1 {name=l23 lab=left}
C {symbols/lab_pin.sym} 1780 1000 0 0 {name=l24 lab=left}
C {symbols/lab_pin.sym} 1820 970 0 1 {name=l25 lab=vin}
C {symbols/lab_pin.sym} 1820 1000 0 1 {name=l26 lab=vin}
T {error_amplifier} 1750 935 0 0 0.2 0.2 {}
C {symbols/pmos4.sym} 2100 1000 0 0 {name=MP2 spiceprefix=X model=sky130_fd_pr__pfet_01v8 w=12 l=1 m=1 extra="nf=1"}
C {symbols/lab_pin.sym} 2120 1030 0 1 {name=l27 lab=right}
C {symbols/lab_pin.sym} 2080 1000 0 0 {name=l28 lab=left}
C {symbols/lab_pin.sym} 2120 970 0 1 {name=l29 lab=vin}
C {symbols/lab_pin.sym} 2120 1000 0 1 {name=l30 lab=vin}
T {error_amplifier} 2050 935 0 0 0.2 0.2 {}
C {symbols/res.sym} 300 1300 0 0 {name=RFTOP value=150k m=1}
C {symbols/lab_pin.sym} 300 1270 0 1 {name=l31 lab=vout}
C {symbols/lab_pin.sym} 300 1330 0 1 {name=l32 lab=fb}
T {feedback} 250 1235 0 0 0.2 0.2 {}
C {symbols/res.sym} 600 1300 0 0 {name=RFBOT value=100k m=1}
C {symbols/lab_pin.sym} 600 1270 0 1 {name=l33 lab=fb}
C {symbols/lab_pin.sym} 600 1330 0 1 {name=l34 lab=vss}
T {feedback} 550 1235 0 0 0.2 0.2 {}
C {symbols/capa.sym} 900 1300 0 0 {name=COUT value=800p m=1}
C {symbols/lab_pin.sym} 900 1270 0 1 {name=l35 lab=vout}
C {symbols/lab_pin.sym} 900 1330 0 1 {name=l36 lab=vss}
T {compensation} 850 1235 0 0 0.2 0.2 {}
C {symbols/capa.sym} 1200 1300 0 0 {name=CCOMP value=100p m=1}
C {symbols/lab_pin.sym} 1200 1270 0 1 {name=l37 lab=drive}
C {symbols/lab_pin.sym} 1200 1330 0 1 {name=l38 lab=vss}
T {compensation} 1150 1235 0 0 0.2 0.2 {}
