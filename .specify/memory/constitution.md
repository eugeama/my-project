<!--
SYNC IMPACT REPORT
==================
Version change: (placeholder) → 1.0.0
Bump type: MINOR — first real ratification; all 8 articles and Governance section added from scratch.

Added sections:
  - Propósito (project description preamble)
  - Core Principles: Articles I–VIII (8 articles)
  - Governance

Removed sections:
  - All placeholder tokens replaced (no bracketed tokens remain)

Templates requiring updates:
  - .specify/templates/plan-template.md  → ✅ Constitution Check gates updated with Article-specific validations
  - .specify/templates/spec-template.md  → ✅ Aligned (scope/out-of-scope constraints now defined; no structural change required)
  - .specify/templates/tasks-template.md → ✅ Aligned (Foundational phase covers Auth + Firestore rules; no structural change required)

Deferred items: None
-->

# RetroSocial Constitution

## Propósito

RetroSocial es una red social minimalista inspirada en el formato de perfiles clásico de MySpace.
Su única función central es permitir que usuarios registrados publiquen posteos cortos.

Este documento es la constitución del proyecto y define los principios **innegociables** que
gobiernan toda decisión de diseño, especificación e implementación. Cualquier spec, plan o tarea
generada posteriormente (via `/specify`, `/plan`, `/tasks`) DEBE ser consistente con estos artículos.
Ante un conflicto entre una feature solicitada y esta constitución, la constitución tiene prioridad
y el conflicto DEBE resolverse explícitamente antes de avanzar.

## Core Principles

### I — Propósito y Alcance del Producto

**Dentro de alcance:**
- Registro e inicio de sesión de usuarios.
- Publicación de posteos de dos tipos: texto corto o foto.
- Edición y borrado de posteos propios (ABM completo).
- Visualización de posteos (propios y ajenos, según se defina en la spec de UI).

**Fuera de alcance** (explícitamente; requieren modificación de esta constitución antes de ser especificados):
- Comentarios, likes, reacciones o cualquier forma de interacción social sobre un posteo.
- Sistema de amigos, seguidores o mensajería privada.
- Feed algorítmico, notificaciones o buscador avanzado.
- Subida de múltiples archivos por posteo o galerías.
- Perfiles personalizables tipo "MySpace" (temas, música, HTML custom). El proyecto toma la
  referencia solo como inspiración estructural, no estética.

Toda propuesta de feature que caiga en "fuera de alcance" REQUIERE una modificación explícita de
esta constitución antes de ser especificada.

### II — Autenticación y Control de Acceso

1. La página principal (`/`) es la pantalla de inicio de sesión (email + contraseña).
2. DEBE existir una página de registro (`/register` o equivalente) accesible desde el login.
3. Un usuario **no autenticado** NO puede acceder a ninguna funcionalidad excepto:
   - Ver la pantalla de login.
   - Ver la pantalla de registro.
4. Un usuario **autenticado** puede:
   - Crear posteos propios.
   - Editar o eliminar **únicamente** sus propios posteos.
   - Ver posteos de otros usuarios (solo lectura).
5. La autenticación se implementa con Firebase Authentication (email/password). No se requieren
   proveedores sociales (Google, Facebook, etc.) salvo que se agreguen explícitamente al alcance.
6. Toda ruta protegida DEBE validar sesión activa tanto en el cliente (React) como en las reglas
   de seguridad del backend (Firestore/Storage Rules). La validación en el cliente es una capa de
   UX, **nunca** la única barrera de seguridad.

### III — Modelo de Contenido: Posteos

1. Existen exactamente **dos tipos de posteo**, mutuamente excluyentes:
   - **Posteo de texto**: máximo 100 caracteres. Sin formato enriquecido (sin HTML, sin markdown).
   - **Posteo de foto**: una sola imagen por posteo, sin texto asociado.
2. Un posteo NUNCA puede contener texto y foto simultáneamente. La UI DEBE forzar esta elección
   antes de permitir publicar (por ejemplo, dos acciones separadas: "Publicar texto" / "Publicar foto").
3. Cada posteo pertenece a un único usuario (el autor) y DEBE guardar una referencia inequívoca
   a su `userId`.
4. Cada posteo DEBE registrar fecha de creación y, si corresponde, fecha de última edición.

### IV — Propiedad y ABM de Posteos

1. **Alta**: cualquier usuario autenticado puede crear un posteo propio (texto o foto, nunca ambos).
2. **Baja**: un usuario solo puede eliminar sus propios posteos. No existe borrado por parte de
   terceros ni rol de moderador en este alcance.
3. **Modificación**: un usuario solo puede editar sus propios posteos:
   - Posteo de texto: puede editar el contenido, respetando el límite de 100 caracteres.
   - Posteo de foto: puede reemplazar la imagen.
4. La verificación de propiedad (`post.userId === currentUser.uid`) DEBE aplicarse tanto en la UI
   (ocultar/deshabilitar controles de edición) como en las reglas de seguridad del backend.
   La UI **nunca** es la única línea de defensa.
5. No existen roles de administrador ni permisos especiales en este alcance.

### V — Diseño y Experiencia de Usuario

1. El diseño DEBE ser **simple, limpio y funcional**. Se evita deliberadamente la ambientación
   nostálgica de los 2000 (sin fondos animados, sin gifs, sin música de fondo, sin glitter,
   sin Comic Sans).
2. Se prioriza la usabilidad y la claridad por sobre la decoración.
3. La interfaz DEBE dejar en claro en todo momento si el usuario está autenticado o no, y qué
   acciones tiene disponibles.
4. Responsive/mobile-friendly es deseable pero no bloqueante para el MVP, salvo que se especifique
   lo contrario en una spec posterior.

### VI — Stack Tecnológico

1. **Frontend**: React (SPA). No se introduce otro framework de UI sin modificar esta constitución.
2. **Backend / Infraestructura**: Firebase, específicamente:
   - Firebase Authentication → gestión de usuarios.
   - Firestore → almacenamiento de posteos y metadata.
   - Firebase Storage → almacenamiento de fotos.
3. No se introduce un backend propio (Node/Express, etc.) salvo necesidad justificada y aprobada
   explícitamente; Firebase DEBE cubrir el alcance completo del MVP.
4. Las reglas de seguridad de Firestore y Storage son parte integral del proyecto, no un extra
   opcional, y DEBEN reflejar los Artículos II y IV.

### VII — Seguridad y Reglas de Datos

1. Las Firestore Security Rules DEBEN garantizar como mínimo:
   - **Lectura** de posteos: permitida a cualquier usuario autenticado (o pública, según defina la spec de UI).
   - **Escritura (crear)**: permitida solo si `request.auth != null` y el `userId` del nuevo posteo
     coincide con `request.auth.uid`.
   - **Escritura (editar/borrar)**: permitida solo si el `userId` del posteo existente coincide con
     `request.auth.uid`.
2. Las Storage Rules DEBEN aplicar la misma lógica de propiedad sobre las imágenes subidas.
3. Ningún dato sensible (contraseñas, tokens) se maneja fuera de los mecanismos provistos por
   Firebase Authentication.

### VIII — Simplicidad y Prevención de Scope Creep

1. Ante la duda entre una solución simple y una sofisticada, se elige la simple.
2. No se agregan librerías, patrones de arquitectura o abstracciones que no sean necesarias para
   cumplir el Artículo I.
3. Cualquier feature nueva DEBE evaluarse primero contra la sección "Fuera de alcance" del
   Artículo I antes de ser especificada.

## Governance

- Esta constitución prevalece sobre cualquier spec, plan o tarea que la contradiga.
- Cualquier cambio a estos artículos DEBE hacerse mediante una nueva versión de este documento
  (bump de versión semántica) y DEBE quedar registrado el motivo del cambio:
  - **MAJOR**: eliminación o redefinición incompatible de un artículo.
  - **MINOR**: nuevo artículo, sección o ampliación material de alcance.
  - **PATCH**: clarificaciones, correcciones ortográficas, refinamientos no semánticos.
- El agente de IA que trabaje sobre este proyecto DEBE rechazar o marcar como conflicto cualquier
  solicitud que viole un artículo, y pedir confirmación explícita de que se está modificando la
  constitución antes de proceder.
- Toda spec, plan o lista de tareas generada DEBE incluir una verificación contra esta constitución
  (ver "Constitution Check" en `.specify/templates/plan-template.md`).

**Version**: 1.0.0 | **Ratified**: 2026-07-06 | **Last Amended**: 2026-07-06
