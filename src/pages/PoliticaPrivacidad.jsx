import LegalPageLayout from "../components/legal/LegalPageLayout";

const sections = [
  {
    id: "datos-que-recopilamos",
    title: "Qué datos recopilamos",
    content: (
      <>
        <p>
          PLANE.AR puede recopilar datos de registro y uso vinculados a la
          operación de la cuenta, incluyendo información de identificación del
          negocio, datos de contacto, información de pagos, configuración del
          servicio y datos ingresados para gestionar suscriptores, pagos o
          turnos.
        </p>
        <p>
          Según las funciones utilizadas, también pueden procesarse datos de
          clientes del negocio, como nombre, teléfono, DNI u otra información
          operativa cargada voluntariamente por la persona usuaria dentro de la
          plataforma.
        </p>
      </>
    ),
  },
  {
    id: "para-que-los-usamos",
    title: "Para qué usamos esos datos",
    content: (
      <>
        <p>
          Utilizamos los datos para prestar el servicio, autenticar cuentas,
          guardar configuraciones, mostrar paneles de gestión, procesar
          operaciones solicitadas, responder consultas, administrar planes y
          mejorar el funcionamiento general de la plataforma.
        </p>
        <p>
          También podemos usar información técnica y de uso para prevenir
          fraudes, detectar errores, reforzar seguridad, generar métricas
          internas y mantener la continuidad del producto.
        </p>
      </>
    ),
  },
  {
    id: "base-operativa",
    title: "Base operativa del tratamiento",
    content: (
      <>
        <p>
          El tratamiento de datos se realiza en la medida necesaria para operar
          la plataforma y cumplir con las acciones que la persona usuaria
          solicita al utilizar el servicio, como registrar cuentas, administrar
          clientes, cobrar planes o coordinar turnos.
        </p>
        <p>
          Cuando corresponda, también puede basarse en obligaciones legales,
          necesidades de seguridad y operación legítima del servicio o en el
          consentimiento que la persona usuaria otorgue para determinadas
          interacciones.
        </p>
      </>
    ),
  },
  {
    id: "conservacion",
    title: "Conservación de la información",
    content: (
      <>
        <p>
          Los datos se conservan durante el tiempo razonablemente necesario para
          prestar el servicio, mantener la cuenta activa, resolver incidencias,
          cumplir obligaciones operativas o legales y resguardar evidencia de
          operaciones cuando resulte necesario.
        </p>
        <p>
          Una vez finalizada la relación con la persona usuaria, ciertos datos
          pueden mantenerse por períodos acotados para fines de auditoría,
          seguridad, prevención de fraude o cumplimiento.
        </p>
      </>
    ),
  },
  {
    id: "terceros",
    title: "Compartición con terceros relevantes",
    content: (
      <>
        <p>
          PLANE.AR puede trabajar con proveedores tecnológicos que intervienen
          en funciones de infraestructura, autenticación, base de datos,
          almacenamiento, hosting, correo o medios de pago. Esos terceros
          acceden únicamente a la información necesaria para cumplir su función
          técnica u operativa.
        </p>
        <p>
          No vendemos bases de datos personales. Cualquier intercambio adicional
          de información debe responder a una necesidad operativa, requerimiento
          legal o medida de seguridad razonable.
        </p>
      </>
    ),
  },
  {
    id: "seguridad",
    title: "Seguridad y resguardo",
    content: (
      <>
        <p>
          Implementamos medidas técnicas y organizativas razonables para
          proteger la información contra accesos no autorizados, pérdida,
          alteración o divulgación indebida.
        </p>
        <p>
          La persona usuaria también tiene responsabilidades de seguridad, como
          usar contraseñas robustas, proteger sus accesos y administrar
          correctamente la información que carga en la plataforma.
        </p>
      </>
    ),
  },
  {
    id: "derechos-del-usuario",
    title: "Derechos del usuario",
    content: (
      <>
        <p>
          La persona usuaria puede solicitar información sobre los datos
          asociados a su cuenta, corregir información inexacta o pedir
          orientación sobre la actualización o eliminación de determinados
          datos, en la medida en que eso resulte compatible con la operación del
          servicio y las obligaciones aplicables.
        </p>
        <p>
          Los pedidos pueden canalizarse por correo electrónico y serán
          evaluados según su alcance, la relación existente con la cuenta y las
          necesidades técnicas y legales involucradas.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Uso de cookies y tecnologías similares",
    content: (
      <>
        <p>
          El sitio y la plataforma pueden utilizar cookies o mecanismos
          equivalentes para sostener la sesión, recordar preferencias, facilitar
          el acceso, analizar funcionamiento y mejorar la experiencia general de
          uso.
        </p>
      </>
    ),
  },
  {
    id: "contacto",
    title: "Contacto por privacidad",
    content: (
      <>
        <p>
          Para consultas sobre privacidad, tratamiento de datos o actualización
          de esta política, la vía de contacto operativa es{" "}
          <a
            className="font-semibold text-[#2785aa] underline decoration-[#2785aa]/30 underline-offset-4"
            href="mailto:hola@plane.ar"
          >
            hola@plane.ar
          </a>
          .
        </p>
      </>
    ),
  },
];

const highlights = [
  {
    title: "Datos operativos",
    body: "Se procesan datos necesarios para autenticar cuentas, administrar negocios y sostener funcionalidades del producto.",
  },
  {
    title: "Terceros técnicos",
    body: "La plataforma puede apoyarse en proveedores de infraestructura, base de datos, correo y pagos para operar.",
  },
];

export default function PoliticaPrivacidad() {
  return (
    <LegalPageLayout
      title="Política de Privacidad"
      description="Política de privacidad de PLANE.AR sobre la recopilación, uso y resguardo de datos asociados al uso de la plataforma."
      canonical="https://plane.ar/politica-de-privacidad"
      eyebrow="Tratamiento de datos"
      updatedAt="22 de abril de 2026"
      intro="Este documento explica qué información puede procesar PLANE.AR, con qué finalidad se usa y cuáles son los canales de consulta disponibles."
      sections={sections}
      highlights={highlights}
      relatedLinks={[
        { label: "Ver Términos y Condiciones", to: "/terminos-y-condiciones" },
      ]}
    />
  );
}
