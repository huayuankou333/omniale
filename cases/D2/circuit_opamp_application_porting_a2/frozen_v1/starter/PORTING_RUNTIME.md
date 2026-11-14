The worker uses ngspice 46 with hsa compatibility and ng_nomodcheck, as the upstream port benchmark requires. Use only the fixed /opt/sky130/continuous/sky130.lib.spice. Run python3 /opt/simulationle-policy/check.py /app/circuit.spi for public policy checks. Create your own testbenches and analyses in /app/experiments. The final source is /app/circuit.spi; output text/code block is not submitted.

The trusted startup explicitly sets num_threads=1; the OMP_NUM_THREADS environment variable alone is insufficient for this build. The two-CPU container limit is unchanged.
