# Compound right-angle gearbox (4 bevel gears, two 90-degree stages)
# Input  : +Z shaft at (x,y)=(12,0)      gear A  (drives)
# Compound: +X shaft at (y,z)=(0,18)     gears B1 (driven) + B2 (drives), rigidly linked
# Output : +Y shaft at (x,z)=(40,18)     gear O  (driven)
# Stage 1 large (10/14 teeth), stage 2 small (11/15 teeth); output reversed.

TAU = 2.0 * math.pi


def bevel_gear(R_in, R_out, gamma, N, ha, hf, r_bore, f_frac):
    """Bevel gear in a local frame: axis +Z, pitch-cone apex at origin,
    body towards +Z, one tooth centred on +X (azimuth 0)."""
    da = math.atan(ha / R_out)          # addendum angle
    df = math.atan(hf / R_out)          # dedendum angle
    tt = gamma + da                     # tip cone half angle
    tr = gamma - df                     # root cone half angle
    z_toe = R_in * math.cos(tt)
    z_heel = R_out * math.cos(tt)
    # conical blank (solid ring), outer surface = tip cone
    pts = [(r_bore, z_toe), (R_in * math.sin(tt), z_toe),
           (R_out * math.sin(tt), z_heel), (r_bore, z_heel)]
    with BuildPart() as bp:
        with BuildSketch(Plane.XZ):
            with BuildLine():
                Polyline(*pts, close=True)
            make_face()
        revolve(axis=Axis.Z)
    blank = bp.part

    # tooth-space cutter: sector of everything outside the root cone
    Ri_c = R_in * 0.90
    Ro_c = R_out * 1.80
    gp = [(Ri_c * math.sin(tr), Ri_c * math.cos(tr)),
          (Ro_c * math.sin(tr), Ro_c * math.cos(tr)),
          (Ro_c, 0.0), (Ri_c, 0.0)]
    space_ang = (1.0 - f_frac) * TAU / N
    with BuildPart() as gcp:
        with BuildSketch(Plane.XZ):
            with BuildLine():
                Polyline(*gp, close=True)
            make_face()
        revolve(axis=Axis.Z, revolution_arc=math.degrees(space_ang))
    one = gcp.part
    cutters = []
    for k in range(N):
        ang = math.degrees((k + 0.5) * TAU / N - 0.5 * space_ang)
        cutters.append(Rot(0, 0, ang) * one)
    return blank - Compound(children=cutters)


def place(shape, apex, axis, u_dir, phase_deg):
    """Map local +Z -> axis and local +X -> u_dir, then move apex into place."""
    ax = Vector(*axis).normalized()
    u = Vector(*u_dir)
    u = (u - ax * u.dot(ax)).normalized()
    pl = Plane(origin=(0, 0, 0), x_dir=u, z_dir=ax)
    loc = Location(Vector(*apex)) * pl.location
    if phase_deg:
        loc = loc * Rotation(0, 0, phase_deg)
    return loc * shape


# ---------------- stage 1 : input (Z)  <->  compound (X), big pair ----------
N_A, N_B = 10, 14
m1 = 1.4
r_A = N_A * m1 * 0.5
r_B = N_B * m1 * 0.5
gA = math.atan(r_A / r_B)                # input gear pitch-cone half angle
R1 = r_A / math.sin(gA)                  # outer cone distance
Rin1 = 7.5
P1 = (12.0, 0.0, 18.0)                   # input / compound axis intersection

# ---------------- stage 2 : compound (X) <-> output (Y), small pair ---------
N_C, N_O = 11, 15
m2 = 0.95
r_C = N_C * m2 * 0.5
r_O = N_O * m2 * 0.5
gC = math.atan(r_C / r_O)
R2 = r_C / math.sin(gC)
Rin2 = 5.5
P2 = (40.0, 0.0, 18.0)                   # compound / output axis intersection

BORE = 2.35                              # 4.4 mm shaft + clearance
F = 0.40                                 # tooth thickness fraction of pitch

gear_A = place(bevel_gear(Rin1, R1, gA, N_A, 0.90, 1.15, BORE, F),
               P1, (0, 0, 1), (1, 0, 0), 0.0)
gear_B1 = place(bevel_gear(Rin1, R1, math.pi * 0.5 - gA, N_B, 0.90, 1.15, BORE, F),
                P1, (1, 0, 0), (0, 0, 1), 180.0 / N_B)
gear_B2 = place(bevel_gear(Rin2, R2, gC, N_C, 0.65, 0.85, BORE, F),
                P2, (-1, 0, 0), (0, 1, 0), 0.0)
gear_O = place(bevel_gear(Rin2, R2, math.pi * 0.5 - gC, N_O, 0.65, 0.85, BORE, F),
               P2, (0, 1, 0), (-1, 0, 0), 180.0 / N_O)

part = Compound(children=[gear_A, gear_B1, gear_B2, gear_O])
