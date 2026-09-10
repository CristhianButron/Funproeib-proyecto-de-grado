package org.certificaciones.funproeibbackend.scheduler;

import org.certificaciones.funproeibbackend.service.ProgramaService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProgramaEstadoScheduler {

    private final ProgramaService programaService;

    @Scheduled(cron = "0 5 0 * * *")
    public void cerrarProgramasFinalizados() {
        programaService.cerrarProgramasFinalizados();
    }
}
