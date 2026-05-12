import streamlit as st
import tempfile
import os
import json
import numpy as np

try:
    import trimesh
    TRIMESH_OK = True
except ImportError:
    TRIMESH_OK = False

st.set_page_config(page_title="STL Void Fraction Analyzer", layout="wide")
st.title("STL Void Fraction Analyzer")
st.markdown("Lade eine STL-Datei einer Katalysatorschuettung hoch und erhalte die Packungsparameter.")

# --- Sidebar: Eingaben ---
with st.sidebar:
    st.header("Reaktorparameter")
    cyl_radius = st.number_input("Reaktorradius [mm]", min_value=1.0, value=25.0, step=0.5)
    material_density = st.number_input("Materialdichte [kg/m³]", min_value=100.0, value=1800.0, step=50.0)
    st.markdown("---")
    st.caption("Optionale Partikelparameter (nur fuer Einzelpartikel-Kennzahlen benoetigt)")
    p_type = st.selectbox("Pelletform", ["sphere", "cylinder", "Raschig Ring", "trihole", "double_alpha", "ribbed_ring", "andere"])
    p_radius = st.number_input("Partikelradius [mm]", min_value=0.1, value=3.0, step=0.1)
    p_length = st.number_input("Partikellaenge [mm] (0 = Kugel)", min_value=0.0, value=6.0, step=0.1)
    p_inner_radius = st.number_input("Innenradius [mm] (nur Ringe)", min_value=0.0, value=0.0, step=0.1)
    n_particles = st.number_input("Anzahl Partikel (Schaetzung)", min_value=1, value=100, step=1)

uploaded = st.file_uploader("STL-Datei hochladen", type=["stl"])

if uploaded:
    with tempfile.TemporaryDirectory() as tmpdir:
        stl_path = os.path.join(tmpdir, "bed.stl")
        with open(stl_path, "wb") as f:
            f.write(uploaded.read())

        col1, col2 = st.columns([1.2, 1])

        # --- Vorschau ---
        with col1:
            st.subheader("Vorschau")
            if TRIMESH_OK:
                try:
                    mesh = trimesh.load(stl_path, force="mesh")
                    vertices = mesh.vertices
                    faces = mesh.faces

                    try:
                        import plotly.graph_objects as go
                        x, y, z = vertices[:, 0], vertices[:, 1], vertices[:, 2]
                        i, j, k = faces[:, 0], faces[:, 1], faces[:, 2]
                        fig = go.Figure(data=[go.Mesh3d(
                            x=x, y=y, z=z,
                            i=i, j=j, k=k,
                            color="#5a8fa3",
                            opacity=0.85,
                            lighting=dict(ambient=0.4, diffuse=0.8, specular=0.2),
                        )])
                        fig.update_layout(
                            scene=dict(
                                xaxis_title="X [mm]",
                                yaxis_title="Y [mm]",
                                zaxis_title="Z [mm]",
                                bgcolor="#0e1117",
                            ),
                            paper_bgcolor="#0e1117",
                            margin=dict(l=0, r=0, t=0, b=0),
                            height=480,
                        )
                        st.plotly_chart(fig, use_container_width=True)
                    except ImportError:
                        st.info("Plotly nicht installiert – keine 3D-Vorschau moeglich.")
                except Exception as e:
                    st.warning(f"Vorschau nicht moeglich: {e}")
            else:
                st.warning("trimesh nicht installiert.")

        # --- Berechnung ---
        with col2:
            st.subheader("Berechnete Parameter")
            if not TRIMESH_OK:
                st.error("trimesh ist nicht installiert. Bitte pip install trimesh ausfuehren.")
            else:
                try:
                    mesh = trimesh.load(stl_path, force="mesh")

                    if not mesh.is_watertight:
                        st.warning("Mesh ist nicht watertight – Volumenberechnung ist eine Naeherung.")

                    V_particles = abs(mesh.volume)
                    A_particles = float(mesh.area)
                    bounds = mesh.bounds
                    H_bed = float(bounds[1][2] - bounds[0][2])
                    V_bed = np.pi * (cyl_radius ** 2) * H_bed
                    solid_fraction = V_particles / V_bed if V_bed > 0 else 0.0
                    porosity = max(0.0, min(1.0, 1.0 - solid_fraction))
                    specific_surface = A_particles / V_bed if V_bed > 0 else 0.0
                    bulk_density = solid_fraction * material_density
                    sauter = 6.0 * V_particles / A_particles if A_particles > 0 else None

                    # Einzelpartikel
                    R = float(p_radius)
                    L = float(p_length)
                    Ri = float(p_inner_radius)
                    V_single, A_single, aspect_ratio, sphericity = None, None, None, None

                    if p_type == "sphere":
                        V_single = (4/3) * np.pi * R**3
                        A_single = 4 * np.pi * R**2
                        aspect_ratio = 1.0
                    elif p_type == "cylinder" and L > 0:
                        V_single = np.pi * R**2 * L
                        A_single = 2 * np.pi * R * (R + L)
                        aspect_ratio = L / (2 * R)
                    elif p_type == "Raschig Ring" and L > 0:
                        V_single = np.pi * (R**2 - Ri**2) * L
                        A_single = 2*np.pi*(R**2-Ri**2) + 2*np.pi*R*L + 2*np.pi*Ri*L
                        aspect_ratio = L / (2 * R)

                    if V_single and V_single > 0 and A_single:
                        r_eq = (3 * V_single / (4 * np.pi)) ** (1/3)
                        sphericity = (4 * np.pi * r_eq**2) / A_single

                    # Anzeige
                    st.metric("Porositaet (void fraction)", f"{porosity:.4f}")
                    st.metric("Feststoffanteil", f"{solid_fraction:.4f}")
                    st.metric("Betthöhe", f"{H_bed:.2f} mm")
                    st.metric("Bettvolumen", f"{V_bed:.2f} mm³")
                    st.metric("Partikelgesamtvolumen", f"{V_particles:.2f} mm³")
                    st.metric("Spez. Oberflaeche", f"{specific_surface:.4f} mm⁻¹")
                    st.metric("Schuettdichte", f"{bulk_density:.1f} kg/m³")
                    if sauter:
                        st.metric("Sauter-Durchmesser", f"{sauter:.3f} mm")
                    if sphericity:
                        st.metric("Sphärizitaet", f"{sphericity:.4f}")
                    if aspect_ratio:
                        st.metric("Aspektverhaeltnis", f"{aspect_ratio:.3f}")

                    # Download JSON
                    results = {
                        "datei": uploaded.name,
                        "reaktorradius_mm": cyl_radius,
                        "betthöhe_mm": round(H_bed, 4),
                        "bettvolumen_mm3": round(V_bed, 4),
                        "partikelvolumen_total_mm3": round(V_particles, 4),
                        "partikelflaeche_total_mm2": round(A_particles, 4),
                        "porositaet_epsilon": round(porosity, 6),
                        "feststoffanteil": round(solid_fraction, 6),
                        "spez_oberflaeche_mm-1": round(specific_surface, 6),
                        "schuettdichte_kg_m3": round(bulk_density, 2),
                        "sauter_durchmesser_mm": round(sauter, 4) if sauter else None,
                        "sphaerizitaet": round(sphericity, 4) if sphericity else None,
                        "aspektverhaeltnis": round(aspect_ratio, 4) if aspect_ratio else None,
                        "watertight": bool(mesh.is_watertight),
                    }

                    st.markdown("---")
                    st.download_button(
                        label="Ergebnisse als JSON herunterladen",
                        data=json.dumps(results, indent=2, ensure_ascii=False),
                        file_name=f"{uploaded.name.replace('.stl','')}_results.json",
                        mime="application/json",
                    )

                    csv_lines = ["Parameter,Wert,Einheit"]
                    csv_map = [
                        ("Porositaet", results["porositaet_epsilon"], "-"),
                        ("Feststoffanteil", results["feststoffanteil"], "-"),
                        ("Betthöhe", results["betthöhe_mm"], "mm"),
                        ("Bettvolumen", results["bettvolumen_mm3"], "mm3"),
                        ("Partikelvolumen gesamt", results["partikelvolumen_total_mm3"], "mm3"),
                        ("Partikelflaeche gesamt", results["partikelflaeche_total_mm2"], "mm2"),
                        ("Spez. Oberflaeche", results["spez_oberflaeche_mm-1"], "mm-1"),
                        ("Schuettdichte", results["schuettdichte_kg_m3"], "kg/m3"),
                        ("Sauter-Durchmesser", results["sauter_durchmesser_mm"] if results["sauter_durchmesser_mm"] else "", "mm"),
                        ("Sphaerizitaet", results["sphaerizitaet"] if results["sphaerizitaet"] else "", "-"),
                        ("Aspektverhaeltnis", results["aspektverhaeltnis"] if results["aspektverhaeltnis"] else "", "-"),
                    ]
                    for name, val, unit in csv_map:
                        csv_lines.append(f"{name},{val},{unit}")

                    st.download_button(
                        label="Ergebnisse als CSV herunterladen",
                        data="\n".join(csv_lines),
                        file_name=f"{uploaded.name.replace('.stl','')}_results.csv",
                        mime="text/csv",
                    )

                except Exception as e:
                    st.error(f"Fehler bei der Berechnung: {e}")
else:
    st.info("Bitte eine STL-Datei hochladen um zu starten.")