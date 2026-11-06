.subckt dut iref inp inn out

* Reference current is sensed at a diode-connected NMOS drain.
XMNREF iref iref 0 0 sky130_fd_pr__nfet_01v8_lvt W=12 L=1 nf=1 m=1

* Differential-pair tail current.
XMNTAIL ntail iref 0 0 sky130_fd_pr__nfet_01v8_lvt W=48 L=1 nf=1 m=1

* Mirrored bias branch for the second-stage current source.
XMNBIAS pbias iref 0 0 sky130_fd_pr__nfet_01v8_lvt W=6 L=1 nf=1 m=1
XMPBIAS pbias pbias vdd vdd sky130_fd_pr__pfet_01v8_lvt W=24 L=2 nf=1 m=1

* Differential input stage.
* Wider PMOS loads raise the mirror node and input-device VDS.
XMNN nmirror inn ntail 0 sky130_fd_pr__nfet_01v8_lvt W=80 L=2 nf=1 m=1
XMNP nstage inp ntail 0 sky130_fd_pr__nfet_01v8_lvt W=80 L=2 nf=1 m=1
XMPD nmirror nmirror vdd vdd sky130_fd_pr__pfet_01v8_lvt W=150 L=3 nf=1 m=1
XMPM nstage nmirror vdd vdd sky130_fd_pr__pfet_01v8_lvt W=150 L=3 nf=1 m=1

* Reduced-width second-stage NMOS raises the first-stage DC output
* while reducing its capacitive loading.
XMNOUT out nstage 0 0 sky130_fd_pr__nfet_01v8_lvt W=36 L=2 nf=1 m=1
XMPOUT out pbias vdd vdd sky130_fd_pr__pfet_01v8_lvt W=264 L=2 nf=1 m=1

* Miller compensation with a left-half-plane zero.
RCOMP nstage ncomp 4k
CCOMP ncomp out 650f

.ends dut
