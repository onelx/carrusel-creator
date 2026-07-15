# Backlog de ideas — hacia la herramienta perfecta

> Estado: **propuestas** (2026-07-14), pendientes de validación de Osvaldo. Ordenadas por impacto estimado.

## 1. Variantes de portada (A/B de hook) — máximo impacto/costo

La portada define ~80% de la decisión de leer (lo dice el propio prompt del Director). Generar **3 portadas alternativas** con hooks distintos (pregunta provocadora / dato duro / afirmación polémica) y que el usuario elija. Costo marginal bajo (un slide extra ×2), ataca la variable más determinante.

## 2. Caption + hashtags

El producto hoy termina en las imágenes; el caption se escribe a mano en Instagram. El copiloto ya tiene todo el contexto (concepto, narrativa, CTA) — generar el **caption completo con hashtags estratégicos** completa el post 100% listo para publicar. Casi gratis.

## 3. Brand kit — identidad persistente

Kit de marca guardado: logo/handle como marca de agua, tipografías propias, paleta fija, @ en la esquina. Se configura una vez; todo sale con la identidad de la cuenta (el carrusel 15 parece de la misma cuenta que el 1). Simplifica al copiloto: decide *dentro* de la marca, no desde cero.

## 4. Preview realista + chequeos de legibilidad

- **Mockup del feed real**: portada en la grilla del perfil (¿se lee en miniatura?) y en el feed con header.
- **Zonas seguras**: overlay que avisa si el texto cae bajo la UI de Instagram (corazón, compartir, dots del carrusel).
- **Chequeo automático de contraste**: aviso si el texto queda sobre zona clara de la imagen (código puro, sin IA).

## 5. Retoque manual fino — el último 5%

Sin un mínimo de edición manual, el usuario termina en Canva. Alcanza con: **editar texto inline** (click y escribir) y **arrastrar el bloque de texto**. No hace falta un editor completo.

## 6. Métricas reales de Instagram — cerrar el ciclo con la realidad

Las estrellas miden la percepción del usuario; el juez final es Instagram. Cargar (manual al principio: alcance, guardados, compartidos) el rendimiento real de cada carrusel publicado. El playbook (doc 03) pasa de aprender el gusto del usuario a aprender **qué funciona de verdad en su audiencia**. La más ambiciosa; requiere volumen de publicaciones.

## 7. Export server-side (deuda técnica a vigilar)

html2canvas es frágil con tipografías y gradientes (el PNG a veces difiere del preview). Eventualmente renderizar server-side (Satori / Playwright) para PNG pixel-perfect. No urgente.

---

## Descartado conscientemente (por ahora)

Para no ensuciar el foco ("el mejor carrusel posible"):

- Publicación directa / programación vía API de Meta
- Multi-formato (stories, portadas de reels, 1:1)
- Colaboración multi-usuario

## Orden sugerido de incorporación

| Cuándo | Ideas |
|---|---|
| Con el copiloto (Etapas 1-2) | #1 variantes de portada, #2 caption, #4 preview/chequeos |
| Copiloto funcionando | #3 brand kit, #5 retoque manual |
| Con volumen de publicaciones reales | #6 métricas de Instagram |
| Cuando duela | #7 export server-side |
