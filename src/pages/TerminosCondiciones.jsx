import LegalPageLayout from '../components/legal/LegalPageLayout'

const sections = [
  {
    id: 'objeto-del-servicio',
    title: 'Objeto del servicio',
    content: (
      <>
        <p>
          PLANE.AR ofrece una plataforma web para que pequeños negocios administren suscripciones,
          membresías, clientes, pagos, renovaciones y, cuando corresponda, reservas de turnos. El
          servicio se brinda bajo modalidad SaaS y puede incluir funcionalidades gratuitas y de pago.
        </p>
        <p>
          El uso de la plataforma implica la aceptación de estos términos en su versión vigente al
          momento de acceder. Si una persona usuaria no está de acuerdo con estas condiciones, no
          debería utilizar el servicio.
        </p>
      </>
    ),
  },
  {
    id: 'registro-y-cuenta',
    title: 'Registro y cuenta',
    content: (
      <>
        <p>
          Para usar determinadas funciones es necesario crear una cuenta con datos reales, completos
          y actualizados. La persona usuaria es responsable de mantener la confidencialidad de sus
          credenciales y de todas las acciones realizadas desde su cuenta.
        </p>
        <p>
          PLANE.AR puede solicitar verificaciones adicionales cuando detecte actividad inusual,
          riesgo de fraude o incumplimientos de seguridad. La persona titular de la cuenta debe
          notificar de inmediato cualquier acceso no autorizado o sospecha de uso indebido.
        </p>
      </>
    ),
  },
  {
    id: 'uso-permitido',
    title: 'Uso permitido de la plataforma',
    content: (
      <>
        <p>
          La plataforma debe usarse únicamente para fines comerciales legítimos vinculados a la
          gestión del negocio registrado. No está permitido utilizar el servicio para actividades
          ilícitas, engañosas, abusivas o que puedan afectar la disponibilidad, integridad o
          seguridad de la plataforma o de terceros.
        </p>
        <p>
          Tampoco está permitido intentar acceder a cuentas ajenas, extraer información por medios
          automatizados no autorizados, revertir ingeniería del producto ni interferir con los
          mecanismos técnicos o comerciales de PLANE.AR.
        </p>
      </>
    ),
  },
  {
    id: 'planes-precios-y-cambios',
    title: 'Planes, precios y cambios',
    content: (
      <>
        <p>
          PLANE.AR puede ofrecer distintos planes, límites de uso, funciones y condiciones
          comerciales. Los precios, alcances y beneficios informados en la plataforma pueden cambiar
          en el tiempo. Salvo que se indique otra cosa, esos cambios tendrán efecto hacia adelante y
          no sobre períodos ya abonados.
        </p>
        <p>
          Cuando exista integración con medios de pago o suscripciones recurrentes, la persona
          usuaria acepta además las condiciones operativas del proveedor de pagos involucrado. Cada
          negocio es responsable de revisar la información de facturación y mantenerla actualizada.
        </p>
      </>
    ),
  },
  {
    id: 'disponibilidad',
    title: 'Disponibilidad y continuidad',
    content: (
      <>
        <p>
          PLANE.AR procura mantener el servicio disponible de forma continua, pero no garantiza una
          disponibilidad absoluta ni libre de interrupciones. Pueden existir tareas de mantenimiento,
          actualizaciones, incidentes técnicos, caídas de terceros o eventos fuera de control
          razonable que afecten el acceso total o parcial a la plataforma.
        </p>
        <p>
          Se podrán introducir mejoras, correcciones, cambios de interfaz o ajustes funcionales
          cuando resulten necesarios para la operación, seguridad o evolución del producto.
        </p>
      </>
    ),
  },
  {
    id: 'propiedad-intelectual',
    title: 'Propiedad intelectual',
    content: (
      <>
        <p>
          El software, el diseño, la marca, la identidad visual, la documentación y los contenidos
          propios de PLANE.AR pertenecen a sus titulares y se encuentran protegidos por la normativa
          aplicable. El uso del servicio no transfiere derechos de propiedad sobre la plataforma.
        </p>
        <p>
          La persona usuaria conserva la titularidad sobre los datos comerciales que cargue en su
          cuenta, pero otorga a PLANE.AR las autorizaciones técnicas necesarias para almacenar,
          procesar y mostrar esa información con el único fin de prestar el servicio.
        </p>
      </>
    ),
  },
  {
    id: 'limitacion-de-responsabilidad',
    title: 'Limitación de responsabilidad',
    content: (
      <>
        <p>
          En la máxima medida permitida por la normativa aplicable, PLANE.AR no será responsable por
          pérdidas indirectas, lucro cesante, pérdida de clientela, datos o ingresos derivadas del
          uso o imposibilidad de uso del servicio, ni por decisiones comerciales tomadas por la
          persona usuaria con base en la información cargada o generada dentro de la plataforma.
        </p>
        <p>
          La persona usuaria entiende que la plataforma es una herramienta de gestión y que sigue
          siendo su responsabilidad validar la información operativa y comercial de su negocio.
        </p>
      </>
    ),
  },
  {
    id: 'suspension-o-baja',
    title: 'Suspensión o baja de cuentas',
    content: (
      <>
        <p>
          PLANE.AR podrá suspender, restringir o dar de baja cuentas cuando detecte incumplimientos
          de estos términos, uso abusivo, riesgos de seguridad, incumplimientos de pago o situaciones
          que puedan afectar a la plataforma, al resto de las personas usuarias o a terceros.
        </p>
        <p>
          La persona usuaria también puede dejar de usar el servicio en cualquier momento, sin
          perjuicio de las obligaciones pendientes que ya se hubieran generado.
        </p>
      </>
    ),
  },
  {
    id: 'modificaciones',
    title: 'Cambios en estos términos',
    content: (
      <>
        <p>
          PLANE.AR puede actualizar estos términos para reflejar cambios legales, técnicos,
          funcionales o comerciales. La versión vigente será la publicada en el sitio. Si los cambios
          fueran relevantes, se podrán comunicar por medios razonables dentro de la plataforma o por
          correo electrónico.
        </p>
        <p>
          El uso continuado del servicio luego de la publicación de una nueva versión implicará la
          aceptación de las condiciones actualizadas.
        </p>
      </>
    ),
  },
  {
    id: 'contacto',
    title: 'Canal de contacto',
    content: (
      <>
        <p>
          Para consultas sobre estos términos o sobre el uso de la plataforma, la vía de contacto
          operativa es <a className="font-semibold text-[#2785aa] underline decoration-[#2785aa]/30 underline-offset-4" href="mailto:hola@plane.ar">hola@plane.ar</a>.
        </p>
      </>
    ),
  },
]

const highlights = [
  {
    title: 'Alcance del servicio',
    body: 'PLANE.AR brinda una herramienta de gestión para negocios con membresías, suscripciones, pagos y turnos.',
  },
  {
    title: 'Responsabilidad operativa',
    body: 'Cada negocio sigue siendo responsable por la información comercial que carga, comunica y utiliza dentro de la plataforma.',
  },
]

export default function TerminosCondiciones() {
  return (
    <LegalPageLayout
      title="Términos y Condiciones"
      description="Términos y condiciones de uso de PLANE.AR para negocios que usan la plataforma para gestionar suscripciones, membresías y turnos."
      canonical="https://plane.ar/terminos-y-condiciones"
      eyebrow="Marco de uso"
      updatedAt="22 de abril de 2026"
      intro="Estas condiciones describen cómo se usa PLANE.AR, qué responsabilidades asume cada parte y bajo qué reglas opera el servicio."
      sections={sections}
      highlights={highlights}
      relatedLinks={[{ label: 'Ver Política de Privacidad', to: '/politica-de-privacidad' }]}
    />
  )
}
