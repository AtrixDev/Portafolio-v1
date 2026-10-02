#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera las demos "pro" (diseñadas con Impeccable y principios de Emil Kowalski). Pisan a las versiones simples del mismo id."""
import lab_demos_pro_tienda as T, lab_demos_pro_inmobiliaria as I, lab_demos_pro_estetica as E, lab_demos_pro_profesional as P, lab_demos_pro_gimnasio as G
IDS = ["tienda", "inmobiliaria", "estetica", "profesional", "gimnasio"]
def main():
    for m in (T, I, E, P, G): m.main()
if __name__ == "__main__":
    main()
