package server.web.api;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import server.base.DocTags;
import server.web.support.ApiBaseController;

@Tag(name = DocTags.SAMPLE)
@RestController
public class ZeroRuleController extends ApiBaseController {

    @GetMapping("/p/hello")
    public String hello() {
        return "hello zero!!";
    }


}
