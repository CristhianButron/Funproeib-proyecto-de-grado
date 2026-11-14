package org.certificaciones.funproeibbackend.scheduler;

import org.certificaciones.funproeibbackend.service.ProgramaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

@DisplayName("ProgramaEstadoScheduler")
class ProgramaEstadoSchedulerTest {

    @Test
    @DisplayName("El trabajo programado delega en ProgramaService.cerrarProgramasFinalizados")
    void cerrarProgramasFinalizados_delegaEnElServicio() {
        ProgramaService programaService = mock(ProgramaService.class);
        ProgramaEstadoScheduler scheduler = new ProgramaEstadoScheduler(programaService);

        scheduler.cerrarProgramasFinalizados();

        verify(programaService).cerrarProgramasFinalizados();
    }
}
