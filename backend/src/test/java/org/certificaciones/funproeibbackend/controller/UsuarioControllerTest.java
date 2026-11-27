package org.certificaciones.funproeibbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.certificaciones.funproeibbackend.dto.*;
import org.certificaciones.funproeibbackend.model.enums.*;
import org.certificaciones.funproeibbackend.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Cubre los endpoints de UsuarioController que no pasan por
 * UsuarioControllerIntegrationTest (registro/verificación/login ya están
 * probados ahí contra una base real): perfil, listado y administración de
 * roles/estado.
 */
@DisplayName("UsuarioController (endpoints no cubiertos por la prueba de integración)")
class UsuarioControllerTest {

    private MockMvc mockMvc;
    private UsuarioService usuarioService;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @BeforeEach
    void setUp() {
        usuarioService = mock(UsuarioService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new UsuarioController(usuarioService)).build();
    }

    private UsuarioResponse responseDePrueba() {
        return UsuarioResponse.builder().id(1L).nombreCompleto("Ana Quispe").correo("ana@correo.com")
                .rol(RolUsuario.POSTULANTE).build();
    }

    @Test
    @DisplayName("GET /api/usuarios/{id} devuelve el usuario")
    void obtenerPorId_devuelve200() throws Exception {
        when(usuarioService.obtenerPorId(1L)).thenReturn(responseDePrueba());

        mockMvc.perform(get("/api/usuarios/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correo").value("ana@correo.com"));
    }

    @Test
    @DisplayName("PUT /api/usuarios/{id} actualiza el perfil")
    void actualizarPerfil_devuelve200() throws Exception {
        when(usuarioService.actualizarPerfil(eq(1L), any())).thenReturn(responseDePrueba());

        UsuarioActualizarRequest request = new UsuarioActualizarRequest();
        request.setNombre("Ana");
        request.setApellidoPaterno("Quispe");
        request.setCi("12345678");
        request.setGenero(Genero.FEMENINO);
        request.setFechaNacimiento(LocalDate.of(1995, 5, 5));
        request.setNivelEducativo(NivelEducativo.SECUNDARIA);
        request.setIdCiudad(1L);
        request.setEstadoCivil(EstadoCivil.SOLTERO);
        request.setIdCiudadNacimiento(1L);

        mockMvc.perform(put("/api/usuarios/1")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/usuarios lista todos")
    void listarTodos_devuelveLista() throws Exception {
        when(usuarioService.listarTodos()).thenReturn(List.of(responseDePrueba()));

        mockMvc.perform(get("/api/usuarios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("GET /api/usuarios/pendientes-identidad lista las cuentas por verificar")
    void listarPendientesIdentidad_devuelveLista() throws Exception {
        when(usuarioService.listarPendientesIdentidad()).thenReturn(List.of(responseDePrueba()));

        mockMvc.perform(get("/api/usuarios/pendientes-identidad"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("DELETE /api/usuarios/{id} elimina la cuenta y responde 204")
    void eliminar_devuelve204() throws Exception {
        mockMvc.perform(delete("/api/usuarios/1"))
                .andExpect(status().isNoContent());

        verify(usuarioService).eliminar(1L);
    }

    @Test
    @DisplayName("POST /api/usuarios/reenviar-verificacion devuelve 204")
    void reenviarVerificacion_devuelve204() throws Exception {
        ReenviarVerificacionRequest request = new ReenviarVerificacionRequest();
        request.setCorreo("ana@correo.com");

        mockMvc.perform(post("/api/usuarios/reenviar-verificacion")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        verify(usuarioService).reenviarVerificacion("ana@correo.com");
    }

    @Test
    @DisplayName("POST /api/usuarios/cambiar-password devuelve 204")
    void cambiarPassword_devuelve204() throws Exception {
        CambiarPasswordRequest request = new CambiarPasswordRequest();
        request.setIdUsuario(1L);
        request.setContrasenaActual("vieja1234");
        request.setContrasenaNueva("Nueva@1234");

        mockMvc.perform(post("/api/usuarios/cambiar-password")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        verify(usuarioService).cambiarPassword(any());
    }

    @Test
    @DisplayName("POST /api/usuarios/olvide-password devuelve 204")
    void olvidePassword_devuelve204() throws Exception {
        OlvidePasswordRequest request = new OlvidePasswordRequest();
        request.setCorreo("ana@correo.com");

        mockMvc.perform(post("/api/usuarios/olvide-password")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        verify(usuarioService).solicitarRecuperacionPassword("ana@correo.com");
    }

    @Test
    @DisplayName("POST /api/usuarios/restablecer-password devuelve 204")
    void restablecerPassword_devuelve204() throws Exception {
        RestablecerPasswordRequest request = new RestablecerPasswordRequest();
        request.setToken("token-123");
        request.setContrasenaNueva("NuevaClave@123");

        mockMvc.perform(post("/api/usuarios/restablecer-password")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        verify(usuarioService).restablecerPassword(any());
    }

    @Test
    @DisplayName("PATCH /api/usuarios/{id}/rol cambia el rol")
    void cambiarRol_devuelve200() throws Exception {
        when(usuarioService.cambiarRol(1L, RolUsuario.EVALUADOR)).thenReturn(
                UsuarioResponse.builder().id(1L).rol(RolUsuario.EVALUADOR).build());

        mockMvc.perform(patch("/api/usuarios/1/rol").param("rol", "EVALUADOR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("EVALUADOR"));
    }

    @Test
    @DisplayName("PATCH /api/usuarios/{id}/activo cambia el estado activo")
    void cambiarActivo_devuelve200() throws Exception {
        when(usuarioService.cambiarActivo(1L, false)).thenReturn(
                UsuarioResponse.builder().id(1L).activo(false).build());

        mockMvc.perform(patch("/api/usuarios/1/activo").param("activo", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activo").value(false));
    }

    @Test
    @DisplayName("GET /api/usuarios/{id}/carnet/anverso devuelve la foto")
    void carnetAnverso_devuelve200() throws Exception {
        ArchivoDescargable archivo = ArchivoDescargable.builder()
                .recurso(new ByteArrayResource("img".getBytes()))
                .contentType("image/jpeg")
                .nombreArchivo("carnet-anverso.jpg")
                .build();
        when(usuarioService.obtenerCarnet(1L, true)).thenReturn(archivo);

        mockMvc.perform(get("/api/usuarios/1/carnet/anverso"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/usuarios/{id}/carnet/reverso devuelve la foto")
    void carnetReverso_devuelve200() throws Exception {
        ArchivoDescargable archivo = ArchivoDescargable.builder()
                .recurso(new ByteArrayResource("img".getBytes()))
                .contentType("image/png")
                .nombreArchivo("carnet-reverso.png")
                .build();
        when(usuarioService.obtenerCarnet(1L, false)).thenReturn(archivo);

        mockMvc.perform(get("/api/usuarios/1/carnet/reverso"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PATCH /api/usuarios/{id}/identidad/verificar marca la identidad como verificada")
    void verificarIdentidad_devuelve200() throws Exception {
        when(usuarioService.verificarIdentidad(1L)).thenReturn(
                UsuarioResponse.builder().id(1L).identidadVerificada(true).build());

        mockMvc.perform(patch("/api/usuarios/1/identidad/verificar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.identidadVerificada").value(true));
    }

    @Test
    @DisplayName("PATCH /api/usuarios/{id}/identidad/rechazar elimina la cuenta y responde 204")
    void rechazarIdentidad_devuelve204() throws Exception {
        mockMvc.perform(patch("/api/usuarios/1/identidad/rechazar"))
                .andExpect(status().isNoContent());

        verify(usuarioService).rechazarIdentidad(1L);
    }
}
