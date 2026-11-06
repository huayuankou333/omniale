.subckt dut iref inp inn out

* Reference-current mirror and input-stage tail bias.
XMNREF iref iref 0 0 sky130_fd_pr__nfet_01v8_lvt W=12 L=1 nf=1 m=1
XMNTAIL ntail iref 0 0 sky130_fd_pr__nfet_01v8_lvt W=48 L=1 nf=1 m=1

* Mirrored reference branch generates the PMOS output-stage bias.
XMNBIAS pbias iref 0 0 sky130_fd_pr__nfet_01v8_lvt W=6 L=1 nf=1 m=1
XMPBIAS pbias pbias vdd vdd sky130_fd_pr__pfet_01v8_lvt W=12 L=1 nf=1 m=1

* NMOS differential input stage with PMOS mirror load.
XMNP nmirror inp ntail 0 sky130_fd_pr__nfet_01v8_lvt W=60 L=1.5 nf=1 m=1
XMNN nstage inn ntail 0 sky130_fd_pr__nfet_01v8_lvt W=60 L=1.5 nf=1 m=1
XMPD nmirror nmirror vdd vdd sky130_fd_pr__pfet_01v8_lvt W=18 L=1 nf=1 m=1
XMPM nstage nmirror vdd vdd sky130_fd_pr__pfet_01v8_lvt W=18 L=1 nf=1 m=1

* Common-source second stage.
XMNOUT out nstage 0 0 sky130_fd_pr__nfet_01v8_lvt W=72 L=0.6 nf=1 m=1
XMPOUT out pbias vdd vdd sky130_fd_pr__pfet_01v8_lvt W=132 L=1 nf=1 m=1

* Series-R Miller compensation.
RCOMP nstage ncomp 2.2k
CCOMP ncomp out 800f

.ends dut
