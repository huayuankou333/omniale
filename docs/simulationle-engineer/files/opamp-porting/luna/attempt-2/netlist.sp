.subckt dut iref inp inn out
* Reference-current sink and mirrors
XMNREF iref iref 0 0 sky130_fd_pr__nfet_01v8_lvt W=2 L=1 nf=1 m=1
XMTAIL tail iref 0 0 sky130_fd_pr__nfet_01v8_lvt W=4 L=1 nf=1 m=1
XMNBIAS pbiassink iref 0 0 sky130_fd_pr__nfet_01v8_lvt W=2 L=1 nf=1 m=1
XMPBIAS pbiassink pbiassink vdd vdd sky130_fd_pr__pfet_01v8_lvt W=4 L=1 nf=1 m=1

* Differential input stage and PMOS current-mirror load
XMN1 n1 inn tail 0 sky130_fd_pr__nfet_01v8_lvt W=8 L=1.5 nf=1 m=1
XMN2 n2 inp tail 0 sky130_fd_pr__nfet_01v8_lvt W=8 L=1.5 nf=1 m=1
XMP1 n1 n1 vdd vdd sky130_fd_pr__pfet_01v8_lvt W=16 L=1.5 nf=1 m=1
XMP2 n2 n1 vdd vdd sky130_fd_pr__pfet_01v8_lvt W=16 L=1.5 nf=1 m=1

* Second gain stage
XMNOUT out n2 0 0 sky130_fd_pr__nfet_01v8_lvt W=16 L=1 nf=1 m=1
XMPLOAD out pbiassink vdd vdd sky130_fd_pr__pfet_01v8_lvt W=8 L=1.5 nf=1 m=2

* Frequency compensation
RZ n2 ncomp 1k
CC ncomp out 1p
.ends dut
