package server.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.ApplicationPidFileWriter;
import server.base.BuildVars;

import java.util.TimeZone;

@SpringBootApplication(
		scanBasePackages = {
				BuildVars.Package.base,
				BuildVars.Package.repo,
				BuildVars.Package.service,
				BuildVars.Package.web,
				BuildVars.Package.security,
				BuildVars.Package.setup,
				"server.app",
				BuildVars.FrameworkPackage.web,
				BuildVars.FrameworkPackage.impl
		}
)
public class App {

	public static void main(String[] args) {

		TimeZone timeZone = TimeZone.getTimeZone("Asia/Seoul");
		TimeZone.setDefault(timeZone);

		SpringApplication application = new SpringApplication();
		application.addListeners(new ApplicationPidFileWriter("cloverserver.pid"));
		application.run(App.class, args);

	}

}
