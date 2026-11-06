.subckt dut iref inp inn out

* Reference-current mirror.
XMNREF iref iref 0 0 sky130_fd_pr__nfet_01v8_lvt W=12 L=1 nf=1 m=1
XMNTAIL ntail iref 0 0 sky130_fd_pr__nfet_01v8_lvt W=48 L=1 nf=1 m=1

* Mirrored reference branch for the output-stage current source.
XMNBIAS pbias iref 0 0 sky130_fd_pr__nfet_01v8_lvt W=6 L=1 nf=1 m=1
XMPBIAS pbias pbias vdd vdd sky130_fd_pr__pfet_01v8_lvt W=48 L=4 nf=1 m=1

* Differential input stage; polarity gives negative unity-gain feedback.
XMNN nmirror inn ntail 0 sky130_fd_pr__nfet_01v8_lvt W=120 L=3 nf=1 m=1
XMNP nstage inp ntail 0 sky130_fd_pr__nfet_01v8_lvt W=120 L=3 nf=1 m=1
XMPD nmirror nmirror vdd vdd sky130_fd_pr__pfet_01v8_lvt W=27 L=1.5 nf=1 m=1
XMPM nstage nmirror vdd vdd sky130_fd_pr__pfet_01v8_lvt W=27 L=1.5 nf=1 m=1

* Long-channel second stage.
XMNOUT out nstage 0 0 sky130_fd_pr__nfet_01v8_lvt W=360 L=3 nf=1 m=1
XMPOUT out pbias vdd vdd sky130_fd_pr__pfet_01v8_lvt W=528 L=4 nf=1 m=1

* Miller compensation with a series zero-setting resistor.
RCOMP nstage ncomp 3k
CCOMP ncomp out 800f

.ends dut
