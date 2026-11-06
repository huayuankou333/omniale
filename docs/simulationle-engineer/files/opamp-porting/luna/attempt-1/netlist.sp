.subckt dut iref inp inn out
* Reference sink and NMOS current mirrors
XMNREF iref iref 0 0 sky130_fd_pr__nfet_01v8_lvt W=2 L=1 nf=1 m=1
XMTAIL tailbias iref 0 0 sky130_fd_pr__nfet_01v8_lvt W=4 L=1 nf=1 m=1
XM2BIAS pmbias iref 0 0 sky130_fd_pr__nfet_01v8_lvt W=2 L=1 nf=1 m=1

* PMOS bias mirror
XMPREF pmbias pmbias vdd vdd sky130_fd_pr__pfet_01v8_lvt W=4 L=1 nf=1 m=1

* First stage: NMOS differential pair with PMOS current-mirror load
XMTAILDEV tail inp 0 0 sky130_fd_pr__nfet_01v8_lvt W=4 L=1 nf=1 m=2
XM1 n1 inn tail 0 sky130_fd_pr__nfet_01v8_lvt W=4 L=1 nf=1 m=1
XM2 n2 inp tail 0 sky130_fd_pr__nfet_01v8_lvt W=4 L=1 nf=1 m=1
XMP1 n1 n1 vdd vdd sky130_fd_pr__pfet_01v8_lvt W=8 L=1 nf=1 m=1
XMP2 n2 n1 vdd vdd sky130_fd_pr__pfet_01v8_lvt W=8 L=1 nf=1 m=1

* Second stage and Miller compensation
XMNOUT out n2 0 0 sky130_fd_pr__nfet_01v8_lvt W=12 L=0.5 nf=1 m=1
XMPLOAD out pmbias vdd vdd sky130_fd_pr__pfet_01v8_lvt W=8 L=1 nf=1 m=2
RZ n2 ncomp 2k
CC ncomp out 2p
.ends dut
