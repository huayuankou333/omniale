.subckt dut iref inp inn out
* Reference-current sensing and bias mirrors
XMNREF iref iref 0 0 sky130_fd_pr__nfet_01v8_lvt W=2 L=1 nf=1 m=1
XMTAIL tail iref 0 0 sky130_fd_pr__nfet_01v8_lvt W=4 L=1 nf=1 m=1

* PMOS load-current reference, set by the mirrored reference current
XMPREF pmbias pmbias vdd vdd sky130_fd_pr__pfet_01v8_lvt W=8 L=1.5 nf=1 m=1

* Differential first stage
XMN1 n1 inn tail 0 sky130_fd_pr__nfet_01v8_lvt W=8 L=1.5 nf=1 m=1
XMN2 n2 inp tail 0 sky130_fd_pr__nfet_01v8_lvt W=8 L=1.5 nf=1 m=1
XMP1 n1 n1 vdd vdd sky130_fd_pr__pfet_01v8_lvt W=16 L=1.5 nf=1 m=1
XMP2 n2 n1 vdd vdd sky130_fd_pr__pfet_01v8_lvt W=16 L=1.5 nf=1 m=1

* Second gain stage; large PMOS width reduces its overdrive and preserves saturation
XMNOUT out n2 0 0 sky130_fd_pr__nfet_01v8_lvt W=16 L=1.5 nf=1 m=1
XMPLOAD out pmbias vdd vdd sky130_fd_pr__pfet_01v8_lvt W=32 L=1.5 nf=1 m=1

* Miller compensation
RZ n2 ncomp 1k
CC ncomp out 500f
.ends dut
