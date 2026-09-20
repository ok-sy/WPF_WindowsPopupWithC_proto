package server.app.config;

import com.google.common.collect.Lists;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import server.base.DocTags;


@Configuration
public class SwaggerConfig {
    @Bean
    @Profile("local")
    public OpenAPI openApiForLocal() {
        return createOpenAPI("http://localhost:8080/zero-rule-server", "local server");
    }

    @Bean
    @Profile("dev")
    public OpenAPI openApiForDev() {
        return createOpenAPI("http://zerorule.labcl.net/zero-rule-server", "labcl server");
//        return createOpenAPI("http://192.168.184.134:8080/zero-rule-server", "labcl server");
    }

    private OpenAPI createOpenAPI(String server, String serverDescription) {
        return new OpenAPI()
            .components(new Components())
            .info(
                new Info().title("ZERO RULE API 명세서")
                    .description("API 명세서")
                    .version("v1.0.0")
                    .contact(new Contact().name("zero rule manager").email("zerorule@gmail.com"))
            )
            .tags(
                Lists.newArrayList(
                    newTag(DocTags.SAMPLE, DocTags.SAMPLE_DESC),
                    newTag(DocTags.AUTH, DocTags.AUTH_DESC),
                    newTag(DocTags.PDS, DocTags.PDS_DESC),
                    newTag(DocTags.META, DocTags.META_DESC),
                    newTag(DocTags.USER, DocTags.USER_DESC),
                    newTag(DocTags.META_GLOSSARY, DocTags.META_GLOSSARY_DESC),
                    newTag(DocTags.TEAM, DocTags.TEAM_DESC),
                    newTag(DocTags.CMMN, DocTags.CMMN_DESC)
                )
            )
            .servers(
                Lists.newArrayList(
                    new Server().url(server).description(serverDescription)
                )
            );
    }

    private Tag newTag(String name, String desc) {
        Tag tag = new Tag();
        tag.setName(name);
        tag.setDescription(desc);
        return tag;
    }
}
