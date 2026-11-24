import pytest

from fastapi.testclient import TestClient

from app.core.database import get_db
from app.core.security import User, get_current_active_user
from app.main import app


class FakeCollection:
    def __init__(self):
        self.documents = {}

    def has(self, key):
        return key in self.documents

    def get(self, key):
        return self.documents[key]

    def insert(self, document):
        key = document.get("_key") or document.get("id")
        self.documents[key] = document
        return document

    def update(self, document):
        key = document.get("_key") or document.get("id")
        self.documents[key] = {**self.documents.get(key, {}), **document}
        return self.documents[key]

    def delete(self, key):
        if key in self.documents:
            document = self.documents.pop(key)
            return document
        raise KeyError(key)

    def all(self):
        return list(self.documents.values())


class FakeDB:
    def __init__(self):
        self.collections = {
            "organizations": FakeCollection(),
            "strategic_relationships": FakeCollection(),
            "strategic_contracts": FakeCollection(),
            "strategic_groups": FakeCollection(),
            "strategic_group_memberships": FakeCollection(),
            "planning_cycles": FakeCollection(),
            "planning_cycle_participants": FakeCollection(),
            "strategic_themes": FakeCollection(),
            "drivers": FakeCollection(),
            "strategic_questions": FakeCollection(),
            "strategic_question_drivers": FakeCollection(),
            "strategic_objectives": FakeCollection(),
            "strategic_choices": FakeCollection(),
            "strategic_agreements": FakeCollection(),
            "initiatives": FakeCollection(),
            "strategic_choice_initiatives": FakeCollection(),
            "initiative_capabilities": FakeCollection(),
            "initiative_agreements": FakeCollection(),
            "outcomes": FakeCollection(),
            "metrics": FakeCollection(),
            "metric_targets": FakeCollection(),
            "metric_actuals": FakeCollection(),
            "strategy_reviews": FakeCollection(),
            "strategy_review_objectives": FakeCollection(),
            "strategy_review_initiatives": FakeCollection(),
            "strategy_review_outcomes": FakeCollection(),
            "capabilities": FakeCollection(),
            "strategic_choice_capabilities": FakeCollection(),
            "capability_assessments": FakeCollection(),
            "governance_config": FakeCollection(),
        }

    def collection(self, name):
        return self.collections[name]

    def properties(self):
        return {"status": "ok"}


fake_db = FakeDB()


@pytest.fixture(autouse=True)
def reset_fake_db():
    for collection in fake_db.collections.values():
        collection.documents.clear()


async def override_current_user():
    return User(
        id="admin-user",
        username="admin",
        email="admin@example.com",
        roles=["admin", "strategy_admin"],
        is_active=True,
    )


def override_get_db():
    return fake_db


app.dependency_overrides[get_current_active_user] = override_current_user
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def create_choice_traceability_chain(owner_organization_id: str, cycle_name: str = "Initiative Cycle"):
    created_cycle = client.post(
        "/api/v1/planning-cycles",
        json={"name": cycle_name, "owner_organization_id": owner_organization_id, "status": "Draft"},
    )
    assert created_cycle.status_code == 200
    cycle_id = created_cycle.json()["id"]

    created_question = client.post(
        f"/api/v1/planning-cycles/{cycle_id}/strategic-questions",
        json={
            "planning_cycle_id": cycle_id,
            "title": "How do we execute this strategy?",
            "priority": "High",
            "status": "Active",
            "lead_organization_id": owner_organization_id,
        },
    )
    assert created_question.status_code == 200
    question_id = created_question.json()["id"]

    created_objective = client.post(
        f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives",
        json={
            "planning_cycle_id": cycle_id,
            "strategic_question_id": question_id,
            "title": "Execute strategic choices",
            "objective_type": "Operational Excellence",
            "priority": "High",
            "status": "Approved",
            "owner_organization_id": owner_organization_id,
        },
    )
    assert created_objective.status_code == 200
    objective_id = created_objective.json()["id"]

    created_choice = client.post(
        f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices",
        json={
            "planning_cycle_id": cycle_id,
            "strategic_objective_id": objective_id,
            "title": "Launch predictive operations program",
            "choice_type": "Technology",
            "status": "Approved",
            "recommendation": "Recommended",
            "owner_organization_id": owner_organization_id,
        },
    )
    assert created_choice.status_code == 200
    choice_id = created_choice.json()["id"]

    return cycle_id, question_id, objective_id, choice_id


class TestAdministrationRoutes:
    def test_get_organizations(self):
        response = client.get("/api/v1/organizations")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_create_organization(self):
        payload = {
            "name": "Consumer Division",
            "code": "CD-01",
            "description": "Consumer-facing division",
            "organization_type": "Division",
            "status": "active",
            "strategic_classification": "Operational",
            "fiscal_responsibility": "Profit Center",
            "investment_authority": "Approve",
        }
        response = client.post("/api/v1/organizations", json=payload)
        assert response.status_code == 200
        body = response.json()
        assert body["name"] == payload["name"]
        assert body["code"] == payload["code"]
        assert body["strategic_classification"] == "Operational"
        assert body["investment_authority"] == "Approve"

    def test_create_organization_rejects_duplicate_code(self):
        fake_db.collection("organizations").insert(
            {
                "_key": "SMG",
                "name": "Steel Making Services",
                "code": "SMG",
                "status": "active",
            }
        )

        payload = {
            "name": "Steel Making Group",
            "code": "SMG",
            "organization_type": "Business Unit",
            "status": "active",
            "strategic_classification": "Operational",
            "fiscal_responsibility": "Cost Center",
            "investment_authority": "None",
        }
        response = client.post("/api/v1/organizations", json=payload)
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]

    def test_list_organizations_filters_by_search(self):
        fake_db.collection("organizations").insert(
            {
                "_key": "org-1",
                "name": "Corporate",
                "code": "CORP",
                "status": "active",
            }
        )
        fake_db.collection("organizations").insert(
            {
                "_key": "org-2",
                "name": "Consumer Division",
                "code": "CD-01",
                "status": "active",
            }
        )

        response = client.get("/api/v1/organizations", params={"search": "consumer"})
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["code"] == "CD-01"

    def test_list_organizations_skips_malformed_records(self):
        fake_db.collection("organizations").insert(
            {
                "_key": "org-invalid",
                "name": None,
                "status": "active",
            }
        )
        fake_db.collection("organizations").insert(
            {
                "_key": "org-valid",
                "name": "Valid Organization",
                "code": "VALID",
                "status": "active",
            }
        )

        response = client.get("/api/v1/organizations")
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["id"] == "org-valid"

    def test_archive_organization(self):
        fake_db.collection("organizations").insert(
            {
                "_key": "org-1",
                "name": "Consumer Division",
                "code": "CD-01",
                "status": "active",
            }
        )

        response = client.patch("/api/v1/organizations/org-1/archive")
        assert response.status_code == 200
        assert response.json()["status"] == "archived"

    def test_delete_organization(self):
        fake_db.collection("organizations").insert(
            {
                "_key": "org-1",
                "name": "Consumer Division",
                "code": "CD-01",
                "status": "active",
            }
        )

        response = client.delete("/api/v1/organizations/org-1")
        assert response.status_code == 200
        assert response.json()["id"] == "org-1"
        assert not fake_db.collection("organizations").has("org-1")

    def test_create_strategic_contract(self):
        fake_db.collection("strategic_relationships").insert(
            {
                "_key": "rel-1",
                "source_node_id": "org-1",
                "target_node_id": "org-2",
                "relationship_type": "Governance",
                "status": "Draft",
            }
        )

        payload = {
            "relationship_id": "rel-1",
            "concern_alignment": "Required",
            "objective_alignment": "Recommended",
            "capability_alignment": "Shared",
            "investment_alignment": "Joint Approval",
            "outcome_alignment": "Optional",
            "concern_decision_rights": "Approve",
            "objective_decision_rights": "Review",
            "capability_decision_rights": "Consult",
            "investment_decision_rights": "Mandate",
            "outcome_decision_rights": "Inform",
            "review_cadence": "Quarterly",
            "notes": "Joint alignment governance",
            "status": "Draft",
            "version": 1,
        }
        response = client.post("/api/v1/strategic-contracts", json=payload)
        assert response.status_code == 200
        body = response.json()
        assert body["relationship_id"] == payload["relationship_id"]
        assert body["concern_alignment"] == payload["concern_alignment"]

    def test_create_strategic_relationship(self):
        payload = {
            "source_node_id": "org-1",
            "target_node_id": "org-2",
            "relationship_type": "Collaboration",
            "status": "Active",
        }

        response = client.post("/api/v1/strategic-relationships", json=payload)
        assert response.status_code == 200
        body = response.json()
        assert body["source_node_id"] == "org-1"
        assert body["target_node_id"] == "org-2"
        assert body["relationship_type"] == "Collaboration"

    def test_delete_strategic_relationship_cascades_contract(self):
        fake_db.collection("strategic_relationships").insert(
            {
                "_key": "rel-1",
                "source_node_id": "org-1",
                "target_node_id": "org-2",
                "relationship_type": "Governance",
                "status": "Draft",
            }
        )
        fake_db.collection("strategic_contracts").insert(
            {
                "_key": "contract-1",
                "relationship_id": "rel-1",
                "status": "Draft",
            }
        )

        response = client.delete("/api/v1/strategic-relationships/rel-1")
        assert response.status_code == 200
        assert not fake_db.collection("strategic_relationships").has("rel-1")
        assert not fake_db.collection("strategic_contracts").has("contract-1")

    def test_list_relationships_for_node(self):
        fake_db.collection("strategic_relationships").insert(
            {
                "_key": "rel-1",
                "source_node_id": "org-1",
                "target_node_id": "org-2",
                "relationship_type": "Governance",
                "status": "Active",
            }
        )
        fake_db.collection("strategic_relationships").insert(
            {
                "_key": "rel-2",
                "source_node_id": "org-3",
                "target_node_id": "org-4",
                "relationship_type": "Dependency",
                "status": "Draft",
            }
        )

        response = client.get("/api/v1/strategic-relationships", params={"node_id": "org-1"})
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["id"] == "rel-1"

    def test_import_organizations(self):
        csv_content = """name,code,description,organization_type,status,strategic_classification,fiscal_responsibility,investment_authority
    Corporate,CORP,Head office,Corporate,active,Strategic,Enterprise Funded,Own
    India BU,INDIA,India business unit,Business Unit,active,Hybrid,Profit Center,Approve
"""

        response = client.post(
            "/api/v1/organizations/import",
            json={"csv_content": csv_content, "full_reload": False},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["imported"] == 2
        assert body["updated"] == 0
        assert fake_db.collection("organizations").has("CORP")
        assert fake_db.collection("organizations").has("INDIA")

    def test_create_strategic_group(self):
        payload = {
            "name": "Transformation Council",
            "description": "Cross-functional transformation group",
            "group_type": "Strategy Council",
            "status": "Active",
        }

        response = client.post("/api/v1/strategic-groups", json=payload)
        assert response.status_code == 200
        body = response.json()
        assert body["name"] == payload["name"]
        assert body["group_type"] == payload["group_type"]

    def test_add_and_remove_group_member(self):
        fake_db.collection("organizations").insert(
            {
                "_key": "CORP",
                "name": "Corporate",
                "code": "CORP",
                "status": "active",
            }
        )
        group = client.post(
            "/api/v1/strategic-groups",
            json={"name": "Investment Committee", "group_type": "Investment Committee", "status": "Active"},
        )
        assert group.status_code == 200
        group_id = group.json()["id"]

        add_response = client.post(
            f"/api/v1/strategic-groups/{group_id}/members",
            json={"organization_id": "CORP"},
        )
        assert add_response.status_code == 200
        assert add_response.json()["organization_id"] == "CORP"

        list_response = client.get(f"/api/v1/strategic-groups/{group_id}/members")
        assert list_response.status_code == 200
        assert len(list_response.json()) == 1
        assert list_response.json()[0]["organization_name"] == "Corporate"

        remove_response = client.delete(f"/api/v1/strategic-groups/{group_id}/members/CORP")
        assert remove_response.status_code == 200
        assert remove_response.json()["organization_id"] == "CORP"

    def test_archive_strategic_group(self):
        created = client.post(
            "/api/v1/strategic-groups",
            json={"name": "Planning Committee", "group_type": "Planning Committee", "status": "Active"},
        )
        assert created.status_code == 200
        group_id = created.json()["id"]

        archived = client.patch(f"/api/v1/strategic-groups/{group_id}/archive")
        assert archived.status_code == 200
        assert archived.json()["status"] == "Archived"

    def test_create_update_archive_planning_cycle(self):
        fake_db.collection("organizations").insert(
            {
                "_key": "CORP",
                "name": "Corporate",
                "status": "active",
            }
        )

        created = client.post(
            "/api/v1/planning-cycles",
            json={
                "name": "FY2027 Strategic Planning",
                "description": "Annual strategy cycle",
                "owner_organization_id": "CORP",
                "status": "Draft",
            },
        )
        assert created.status_code == 200
        cycle = created.json()
        assert cycle["name"] == "FY2027 Strategic Planning"
        assert cycle["owner_organization_name"] == "Corporate"

        updated = client.put(
            f"/api/v1/planning-cycles/{cycle['id']}",
            json={
                "status": "Planning",
                "description": "Updated planning cycle",
            },
        )
        assert updated.status_code == 200
        assert updated.json()["status"] == "Planning"
        assert updated.json()["description"] == "Updated planning cycle"

        archived = client.patch(f"/api/v1/planning-cycles/{cycle['id']}/archive")
        assert archived.status_code == 200
        assert archived.json()["status"] == "Archived"

    def test_create_planning_cycle_with_dates(self):
        fake_db.collection("organizations").insert(
            {
                "_key": "CORP",
                "name": "Corporate",
                "status": "active",
            }
        )

        created = client.post(
            "/api/v1/planning-cycles",
            json={
                "name": "2028 Operating Strategy",
                "owner_organization_id": "CORP",
                "status": "Planning",
                "start_date": "2028-01-01T00:00:00Z",
                "end_date": "2028-12-31T00:00:00Z",
            },
        )

        assert created.status_code == 200
        body = created.json()
        assert body["start_date"].startswith("2028-01-01")
        assert body["end_date"].startswith("2028-12-31")

    def test_add_and_remove_planning_cycle_participants(self):
        fake_db.collection("organizations").insert(
            {
                "_key": "CORP",
                "name": "Corporate",
                "status": "active",
            }
        )
        fake_db.collection("organizations").insert(
            {
                "_key": "FIN",
                "name": "Finance",
                "status": "active",
            }
        )
        strategic_group = client.post(
            "/api/v1/strategic-groups",
            json={"name": "Investment Committee", "group_type": "Investment Committee", "status": "Active"},
        )
        assert strategic_group.status_code == 200

        created_cycle = client.post(
            "/api/v1/planning-cycles",
            json={
                "name": "2027-2030 Growth Strategy",
                "owner_organization_id": "CORP",
                "status": "Draft",
            },
        )
        assert created_cycle.status_code == 200
        cycle_id = created_cycle.json()["id"]
        group_id = strategic_group.json()["id"]

        add_org = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/participants",
            json={"participant_type": "organization", "participant_id": "FIN"},
        )
        assert add_org.status_code == 200
        assert add_org.json()["participant_name"] == "Finance"

        add_group = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/participants",
            json={"participant_type": "strategic_group", "participant_id": group_id},
        )
        assert add_group.status_code == 200
        assert add_group.json()["participant_name"] == "Investment Committee"

        listed = client.get(f"/api/v1/planning-cycles/{cycle_id}/participants")
        assert listed.status_code == 200
        listed_body = listed.json()
        assert len(listed_body) == 2

        removed_group = client.delete(
            f"/api/v1/planning-cycles/{cycle_id}/participants/strategic_group/{group_id}"
        )
        assert removed_group.status_code == 200
        assert removed_group.json()["participant_type"] == "strategic_group"

    def test_planning_cycle_participant_suggestions_from_active_relationships(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})
        fake_db.collection("organizations").insert({"_key": "SBG", "name": "Steel Bar Group", "status": "active"})
        fake_db.collection("organizations").insert({"_key": "REC", "name": "Recycling", "status": "active"})
        fake_db.collection("organizations").insert({"_key": "HR", "name": "HR", "status": "active"})
        fake_db.collection("organizations").insert({"_key": "OPS", "name": "Operations", "status": "active"})

        fake_db.collection("strategic_relationships").insert(
            {
                "_key": "rel-1",
                "source_node_id": "CORP",
                "target_node_id": "SBG",
                "status": "Active",
            }
        )
        fake_db.collection("strategic_relationships").insert(
            {
                "_key": "rel-2",
                "source_node_id": "CORP",
                "target_node_id": "REC",
                "status": "Active",
            }
        )
        fake_db.collection("strategic_relationships").insert(
            {
                "_key": "rel-3",
                "source_node_id": "CORP",
                "target_node_id": "HR",
                "status": "Active",
            }
        )
        fake_db.collection("strategic_relationships").insert(
            {
                "_key": "rel-4",
                "source_node_id": "CORP",
                "target_node_id": "OPS",
                "status": "Draft",
            }
        )

        response = client.get(
            "/api/v1/planning-cycles/participant-suggestions",
            params={"owner_organization_id": "CORP"},
        )
        assert response.status_code == 200
        suggested_names = [item["organization_name"] for item in response.json()]
        assert "Steel Bar Group" in suggested_names
        assert "Recycling" in suggested_names
        assert "HR" in suggested_names
        assert "Operations" not in suggested_names

    def test_planning_cycle_creation_does_not_auto_assign_suggested_participants(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})
        fake_db.collection("organizations").insert({"_key": "HR", "name": "HR", "status": "active"})
        fake_db.collection("strategic_relationships").insert(
            {
                "_key": "rel-1",
                "source_node_id": "CORP",
                "target_node_id": "HR",
                "status": "Active",
            }
        )

        created = client.post(
            "/api/v1/planning-cycles",
            json={
                "name": "Q1 Strategic Review",
                "owner_organization_id": "CORP",
                "status": "Draft",
            },
        )
        assert created.status_code == 200
        cycle_id = created.json()["id"]

        participants = client.get(f"/api/v1/planning-cycles/{cycle_id}/participants")
        assert participants.status_code == 200
        assert participants.json() == []

    def test_create_update_archive_strategic_theme(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})
        created_cycle = client.post(
            "/api/v1/planning-cycles",
            json={"name": "FY2040 Planning", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert created_cycle.status_code == 200
        cycle_id = created_cycle.json()["id"]

        created_theme = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-themes",
            json={
                "planning_cycle_id": cycle_id,
                "name": "Operational Excellence",
                "description": "Cost, quality, and throughput improvements",
                "status": "Draft",
            },
        )
        assert created_theme.status_code == 200
        theme = created_theme.json()
        assert theme["name"] == "Operational Excellence"

        updated_theme = client.put(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-themes/{theme['id']}",
            json={"status": "Active"},
        )
        assert updated_theme.status_code == 200
        assert updated_theme.json()["status"] == "Active"

        archived_theme = client.patch(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-themes/{theme['id']}/archive"
        )
        assert archived_theme.status_code == 200
        assert archived_theme.json()["status"] == "Archived"

    def test_strategy_artifacts_support_theme_grouping(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})
        created_cycle = client.post(
            "/api/v1/planning-cycles",
            json={"name": "FY2041 Planning", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert created_cycle.status_code == 200
        cycle_id = created_cycle.json()["id"]

        created_theme = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-themes",
            json={
                "planning_cycle_id": cycle_id,
                "name": "Digital Transformation",
                "status": "Active",
            },
        )
        assert created_theme.status_code == 200
        theme_id = created_theme.json()["id"]

        created_driver = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/drivers",
            json={
                "planning_cycle_id": cycle_id,
                "title": "Legacy systems constrain growth",
                "category": "Technology",
                "impact_level": "High",
                "time_horizon": "1-3 Years",
                "status": "Draft",
                "strategic_theme_id": theme_id,
                "owner_organization_id": "CORP",
            },
        )
        assert created_driver.status_code == 200
        assert created_driver.json()["strategic_theme_id"] == theme_id
        assert created_driver.json()["strategic_theme_name"] == "Digital Transformation"

        created_question = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-questions",
            json={
                "planning_cycle_id": cycle_id,
                "title": "How can we modernize core manufacturing systems?",
                "priority": "High",
                "status": "Draft",
                "strategic_theme_id": theme_id,
                "lead_organization_id": "CORP",
            },
        )
        assert created_question.status_code == 200
        question_id = created_question.json()["id"]
        assert created_question.json()["strategic_theme_name"] == "Digital Transformation"

        created_objective = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_question_id": question_id,
                "title": "Migrate 70% of critical workloads",
                "objective_type": "Technology",
                "priority": "High",
                "status": "Draft",
                "strategic_theme_id": theme_id,
                "owner_organization_id": "CORP",
            },
        )
        assert created_objective.status_code == 200
        objective_id = created_objective.json()["id"]
        assert created_objective.json()["strategic_theme_name"] == "Digital Transformation"

        created_choice = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_objective_id": objective_id,
                "title": "Adopt cloud-native MES",
                "choice_type": "Technology",
                "status": "Under Evaluation",
                "recommendation": "No Recommendation",
                "strategic_theme_id": theme_id,
                "owner_organization_id": "CORP",
            },
        )
        assert created_choice.status_code == 200
        assert created_choice.json()["strategic_theme_name"] == "Digital Transformation"

    def test_create_update_archive_driver(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})
        created_cycle = client.post(
            "/api/v1/planning-cycles",
            json={
                "name": "FY2030 Strategic Navigation",
                "owner_organization_id": "CORP",
                "status": "Draft",
            },
        )
        assert created_cycle.status_code == 200
        cycle_id = created_cycle.json()["id"]

        created_driver = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/drivers",
            json={
                "planning_cycle_id": cycle_id,
                "title": "Energy Cost Volatility",
                "description": "Rapid fluctuations in industrial power pricing",
                "category": "Financial",
                "impact_level": "High",
                "time_horizon": "1-3 Years",
                "status": "Draft",
                "owner_organization_id": "CORP",
            },
        )
        assert created_driver.status_code == 200
        driver = created_driver.json()
        assert driver["title"] == "Energy Cost Volatility"
        assert driver["owner_organization_name"] == "Corporate"

        updated_driver = client.put(
            f"/api/v1/planning-cycles/{cycle_id}/drivers/{driver['id']}",
            json={
                "status": "Active",
                "impact_level": "Critical",
            },
        )
        assert updated_driver.status_code == 200
        assert updated_driver.json()["status"] == "Active"
        assert updated_driver.json()["impact_level"] == "Critical"

        archived_driver = client.patch(f"/api/v1/planning-cycles/{cycle_id}/drivers/{driver['id']}/archive")
        assert archived_driver.status_code == 200
        assert archived_driver.json()["status"] == "Archived"

    def test_list_drivers_by_cycle(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})
        fake_db.collection("organizations").insert({"_key": "OPS", "name": "Operations", "status": "active"})

        cycle_a = client.post(
            "/api/v1/planning-cycles",
            json={"name": "Cycle A", "owner_organization_id": "CORP", "status": "Draft"},
        )
        cycle_b = client.post(
            "/api/v1/planning-cycles",
            json={"name": "Cycle B", "owner_organization_id": "OPS", "status": "Draft"},
        )
        assert cycle_a.status_code == 200
        assert cycle_b.status_code == 200

        cycle_a_id = cycle_a.json()["id"]
        cycle_b_id = cycle_b.json()["id"]

        first = client.post(
            f"/api/v1/planning-cycles/{cycle_a_id}/drivers",
            json={
                "planning_cycle_id": cycle_a_id,
                "title": "AI Manufacturing Agents",
                "category": "Technology",
                "impact_level": "High",
                "time_horizon": "3-5 Years",
                "status": "Active",
                "owner_organization_id": "CORP",
            },
        )
        second = client.post(
            f"/api/v1/planning-cycles/{cycle_b_id}/drivers",
            json={
                "planning_cycle_id": cycle_b_id,
                "title": "Regional Emissions Regulation",
                "category": "Regulatory",
                "impact_level": "Medium",
                "time_horizon": "1-3 Years",
                "status": "Draft",
                "owner_organization_id": "OPS",
            },
        )
        assert first.status_code == 200
        assert second.status_code == 200

        listed = client.get(f"/api/v1/planning-cycles/{cycle_a_id}/drivers")
        assert listed.status_code == 200
        body = listed.json()
        assert len(body) == 1
        assert body[0]["title"] == "AI Manufacturing Agents"

    def test_driver_rejects_invalid_category(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})
        created_cycle = client.post(
            "/api/v1/planning-cycles",
            json={"name": "Cycle", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert created_cycle.status_code == 200
        cycle_id = created_cycle.json()["id"]

        bad_driver = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/drivers",
            json={
                "planning_cycle_id": cycle_id,
                "title": "Invalid Driver",
                "category": "Unknown",
                "impact_level": "High",
                "time_horizon": "1-3 Years",
                "status": "Draft",
                "owner_organization_id": "CORP",
            },
        )
        assert bad_driver.status_code == 400

    def test_create_and_answer_strategic_question(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})
        created_cycle = client.post(
            "/api/v1/planning-cycles",
            json={"name": "FY2031 Strategic Planning", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert created_cycle.status_code == 200
        cycle_id = created_cycle.json()["id"]

        created_question = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-questions",
            json={
                "planning_cycle_id": cycle_id,
                "title": "How should we use AI to reduce production costs?",
                "description": "Leadership decision frame for AI-driven efficiency",
                "priority": "High",
                "status": "Draft",
                "lead_organization_id": "CORP",
            },
        )
        assert created_question.status_code == 200
        question = created_question.json()
        assert question["priority"] == "High"
        assert question["status"] == "Draft"

        answered_question = client.put(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-questions/{question['id']}",
            json={"status": "Answered"},
        )
        assert answered_question.status_code == 200
        assert answered_question.json()["status"] == "Answered"

    def test_strategic_question_driver_link_traceability(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})
        created_cycle = client.post(
            "/api/v1/planning-cycles",
            json={"name": "FY2032 Planning", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert created_cycle.status_code == 200
        cycle_id = created_cycle.json()["id"]

        created_driver = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/drivers",
            json={
                "planning_cycle_id": cycle_id,
                "title": "Labor shortages",
                "category": "Workforce",
                "impact_level": "High",
                "time_horizon": "1-3 Years",
                "status": "Active",
                "owner_organization_id": "CORP",
            },
        )
        assert created_driver.status_code == 200
        driver_id = created_driver.json()["id"]

        created_question = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-questions",
            json={
                "planning_cycle_id": cycle_id,
                "title": "How can we operate effectively with fewer skilled workers?",
                "priority": "Critical",
                "status": "Active",
                "lead_organization_id": "CORP",
            },
        )
        assert created_question.status_code == 200
        question = created_question.json()

        linked = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-questions/{question['id']}/drivers",
            json={"driver_id": driver_id},
        )
        assert linked.status_code == 200
        assert linked.json()["driver_id"] == driver_id

        listed_links = client.get(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-questions/{question['id']}/drivers"
        )
        assert listed_links.status_code == 200
        assert len(listed_links.json()) == 1
        assert listed_links.json()[0]["driver_title"] == "Labor shortages"

        listed_questions = client.get(f"/api/v1/planning-cycles/{cycle_id}/strategic-questions")
        assert listed_questions.status_code == 200
        assert len(listed_questions.json()) == 1
        assert listed_questions.json()[0]["drivers_linked"] == 1

        detached = client.delete(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-questions/{question['id']}/drivers/{driver_id}"
        )
        assert detached.status_code == 200
        assert detached.json()["driver_id"] == driver_id

    def test_strategic_objective_requires_strategic_question(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})
        created_cycle = client.post(
            "/api/v1/planning-cycles",
            json={"name": "FY2033 Planning", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert created_cycle.status_code == 200
        cycle_id = created_cycle.json()["id"]

        missing_question = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_question_id": "question-not-found",
                "title": "Reduce production costs by 10%",
                "objective_type": "Operational Excellence",
                "priority": "High",
                "status": "Draft",
                "owner_organization_id": "CORP",
            },
        )
        assert missing_question.status_code == 404

    def test_create_objective_and_trace_to_question(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})
        created_cycle = client.post(
            "/api/v1/planning-cycles",
            json={"name": "FY2034 Planning", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert created_cycle.status_code == 200
        cycle_id = created_cycle.json()["id"]

        question = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-questions",
            json={
                "planning_cycle_id": cycle_id,
                "title": "How can we reduce production costs?",
                "priority": "High",
                "status": "Active",
                "lead_organization_id": "CORP",
            },
        )
        assert question.status_code == 200
        question_id = question.json()["id"]

        created_objective = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_question_id": question_id,
                "title": "Reduce production costs by 10%",
                "description": "Lower per-ton processing cost by FY end",
                "objective_type": "Operational Excellence",
                "priority": "Critical",
                "status": "Proposed",
                "owner_organization_id": "CORP",
                "target_date": "2034-12-31T00:00:00Z",
            },
        )
        assert created_objective.status_code == 200
        objective = created_objective.json()
        assert objective["strategic_question_id"] == question_id
        assert objective["strategic_question_title"] == "How can we reduce production costs?"
        assert objective["status"] == "Proposed"

        approved = client.put(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective['id']}",
            json={"status": "Approved"},
        )
        assert approved.status_code == 200
        assert approved.json()["status"] == "Approved"

        list_by_question = client.get(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-questions/{question_id}/objectives"
        )
        assert list_by_question.status_code == 200
        assert len(list_by_question.json()) == 1
        assert list_by_question.json()[0]["title"] == "Reduce production costs by 10%"

    def test_objective_rejects_question_from_different_cycle(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})

        cycle_a = client.post(
            "/api/v1/planning-cycles",
            json={"name": "Cycle A", "owner_organization_id": "CORP", "status": "Draft"},
        )
        cycle_b = client.post(
            "/api/v1/planning-cycles",
            json={"name": "Cycle B", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert cycle_a.status_code == 200
        assert cycle_b.status_code == 200

        cycle_a_id = cycle_a.json()["id"]
        cycle_b_id = cycle_b.json()["id"]

        question = client.post(
            f"/api/v1/planning-cycles/{cycle_a_id}/strategic-questions",
            json={
                "planning_cycle_id": cycle_a_id,
                "title": "How can we improve supply chain resilience?",
                "priority": "High",
                "status": "Active",
                "lead_organization_id": "CORP",
            },
        )
        assert question.status_code == 200
        question_id = question.json()["id"]

        bad_objective = client.post(
            f"/api/v1/planning-cycles/{cycle_b_id}/strategic-objectives",
            json={
                "planning_cycle_id": cycle_b_id,
                "strategic_question_id": question_id,
                "title": "Reduce imported scrap dependency to 30%",
                "objective_type": "Risk",
                "priority": "High",
                "status": "Draft",
                "owner_organization_id": "CORP",
            },
        )
        assert bad_objective.status_code == 400

    def test_create_and_update_strategic_choice(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})
        created_cycle = client.post(
            "/api/v1/planning-cycles",
            json={"name": "FY2035 Planning", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert created_cycle.status_code == 200
        cycle_id = created_cycle.json()["id"]

        created_question = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-questions",
            json={
                "planning_cycle_id": cycle_id,
                "title": "How can we reduce production costs?",
                "priority": "High",
                "status": "Active",
                "lead_organization_id": "CORP",
            },
        )
        assert created_question.status_code == 200
        question_id = created_question.json()["id"]

        created_objective = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_question_id": question_id,
                "title": "Reduce production costs by 10%",
                "objective_type": "Operational Excellence",
                "priority": "Critical",
                "status": "Proposed",
                "owner_organization_id": "CORP",
            },
        )
        assert created_objective.status_code == 200
        objective_id = created_objective.json()["id"]

        created_choice = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_objective_id": objective_id,
                "title": "Increase automation",
                "description": "Expand process automation in core lines",
                "choice_type": "Technology",
                "status": "Under Evaluation",
                "recommendation": "No Recommendation",
                "owner_organization_id": "CORP",
            },
        )
        assert created_choice.status_code == 200
        choice = created_choice.json()
        assert choice["strategic_objective_id"] == objective_id
        assert choice["strategic_objective_title"] == "Reduce production costs by 10%"

        updated_choice = client.put(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice['id']}",
            json={
                "status": "Recommended",
                "recommendation": "Recommended",
            },
        )
        assert updated_choice.status_code == 200
        assert updated_choice.json()["status"] == "Recommended"
        assert updated_choice.json()["recommendation"] == "Recommended"

    def test_objective_can_have_multiple_strategic_choices(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})
        created_cycle = client.post(
            "/api/v1/planning-cycles",
            json={"name": "FY2036 Planning", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert created_cycle.status_code == 200
        cycle_id = created_cycle.json()["id"]

        created_question = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-questions",
            json={
                "planning_cycle_id": cycle_id,
                "title": "How can we reduce production costs?",
                "priority": "High",
                "status": "Active",
                "lead_organization_id": "CORP",
            },
        )
        assert created_question.status_code == 200
        question_id = created_question.json()["id"]

        created_objective = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_question_id": question_id,
                "title": "Reduce production costs",
                "objective_type": "Financial",
                "priority": "High",
                "status": "Active",
                "owner_organization_id": "CORP",
            },
        )
        assert created_objective.status_code == 200
        objective_id = created_objective.json()["id"]

        for title in ["Modernize existing mills", "Build new mill", "Increase automation"]:
            response = client.post(
                f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices",
                json={
                    "planning_cycle_id": cycle_id,
                    "strategic_objective_id": objective_id,
                    "title": title,
                    "choice_type": "Investment",
                    "status": "Under Evaluation",
                    "recommendation": "No Recommendation",
                    "owner_organization_id": "CORP",
                },
            )
            assert response.status_code == 200

        listed = client.get(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices"
        )
        assert listed.status_code == 200
        assert len(listed.json()) == 3

    def test_choice_rejects_objective_from_different_cycle(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})

        cycle_a = client.post(
            "/api/v1/planning-cycles",
            json={"name": "Cycle A", "owner_organization_id": "CORP", "status": "Draft"},
        )
        cycle_b = client.post(
            "/api/v1/planning-cycles",
            json={"name": "Cycle B", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert cycle_a.status_code == 200
        assert cycle_b.status_code == 200

        cycle_a_id = cycle_a.json()["id"]
        cycle_b_id = cycle_b.json()["id"]

        created_question = client.post(
            f"/api/v1/planning-cycles/{cycle_a_id}/strategic-questions",
            json={
                "planning_cycle_id": cycle_a_id,
                "title": "How can we reduce production costs?",
                "priority": "High",
                "status": "Active",
                "lead_organization_id": "CORP",
            },
        )
        assert created_question.status_code == 200

        created_objective = client.post(
            f"/api/v1/planning-cycles/{cycle_a_id}/strategic-objectives",
            json={
                "planning_cycle_id": cycle_a_id,
                "strategic_question_id": created_question.json()["id"],
                "title": "Reduce production costs",
                "objective_type": "Financial",
                "priority": "High",
                "status": "Active",
                "owner_organization_id": "CORP",
            },
        )
        assert created_objective.status_code == 200
        objective_id = created_objective.json()["id"]

        bad_choice = client.post(
            f"/api/v1/planning-cycles/{cycle_b_id}/strategic-objectives/{objective_id}/choices",
            json={
                "planning_cycle_id": cycle_b_id,
                "strategic_objective_id": objective_id,
                "title": "Acquire competitor",
                "choice_type": "Acquisition",
                "status": "Draft",
                "recommendation": "No Recommendation",
                "owner_organization_id": "CORP",
            },
        )
        assert bad_choice.status_code == 404

    def test_create_and_update_strategic_agreement(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})
        created_cycle = client.post(
            "/api/v1/planning-cycles",
            json={"name": "FY2036 Planning", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert created_cycle.status_code == 200
        cycle_id = created_cycle.json()["id"]

        created_question = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-questions",
            json={
                "planning_cycle_id": cycle_id,
                "title": "How can we reduce production costs?",
                "priority": "High",
                "status": "Active",
                "lead_organization_id": "CORP",
            },
        )
        assert created_question.status_code == 200
        question_id = created_question.json()["id"]

        created_objective = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_question_id": question_id,
                "title": "Reduce production costs by 10%",
                "objective_type": "Operational Excellence",
                "priority": "Critical",
                "status": "Proposed",
                "owner_organization_id": "CORP",
            },
        )
        assert created_objective.status_code == 200
        objective_id = created_objective.json()["id"]

        created_choice = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_objective_id": objective_id,
                "title": "Increase automation",
                "choice_type": "Technology",
                "status": "Under Evaluation",
                "recommendation": "No Recommendation",
                "owner_organization_id": "CORP",
            },
        )
        assert created_choice.status_code == 200
        choice_id = created_choice.json()["id"]

        created_agreement = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/agreements",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_choice_id": choice_id,
                "title": "Automation charter",
                "description": "Operations and IT commit to phased rollout",
                "status": "Negotiating",
                "owner_organization_id": "CORP",
            },
        )
        assert created_agreement.status_code == 200
        agreement = created_agreement.json()
        assert agreement["strategic_choice_id"] == choice_id
        assert agreement["strategic_choice_title"] == "Increase automation"

        updated_agreement = client.put(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/agreements/{agreement['id']}",
            json={
                "status": "Approved",
            },
        )
        assert updated_agreement.status_code == 200
        assert updated_agreement.json()["status"] == "Approved"

    def test_agreement_requires_choice_linkage(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})

        cycle_a = client.post(
            "/api/v1/planning-cycles",
            json={"name": "Cycle A", "owner_organization_id": "CORP", "status": "Draft"},
        )
        cycle_b = client.post(
            "/api/v1/planning-cycles",
            json={"name": "Cycle B", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert cycle_a.status_code == 200
        assert cycle_b.status_code == 200

        cycle_a_id = cycle_a.json()["id"]
        cycle_b_id = cycle_b.json()["id"]

        created_question = client.post(
            f"/api/v1/planning-cycles/{cycle_a_id}/strategic-questions",
            json={
                "planning_cycle_id": cycle_a_id,
                "title": "How can we reduce production costs?",
                "priority": "High",
                "status": "Active",
                "lead_organization_id": "CORP",
            },
        )
        assert created_question.status_code == 200

        created_objective = client.post(
            f"/api/v1/planning-cycles/{cycle_a_id}/strategic-objectives",
            json={
                "planning_cycle_id": cycle_a_id,
                "strategic_question_id": created_question.json()["id"],
                "title": "Reduce production costs",
                "objective_type": "Financial",
                "priority": "High",
                "status": "Active",
                "owner_organization_id": "CORP",
            },
        )
        assert created_objective.status_code == 200
        objective_id = created_objective.json()["id"]

        created_choice = client.post(
            f"/api/v1/planning-cycles/{cycle_a_id}/strategic-objectives/{objective_id}/choices",
            json={
                "planning_cycle_id": cycle_a_id,
                "strategic_objective_id": objective_id,
                "title": "Increase automation",
                "choice_type": "Technology",
                "status": "Under Evaluation",
                "recommendation": "No Recommendation",
                "owner_organization_id": "CORP",
            },
        )
        assert created_choice.status_code == 200
        choice_id = created_choice.json()["id"]

        bad_agreement = client.post(
            f"/api/v1/planning-cycles/{cycle_b_id}/strategic-objectives/{objective_id}/choices/{choice_id}/agreements",
            json={
                "planning_cycle_id": cycle_b_id,
                "strategic_choice_id": choice_id,
                "title": "Invalid cross-cycle agreement",
                "status": "Draft",
                "owner_organization_id": "CORP",
            },
        )
        assert bad_agreement.status_code == 404

    def test_create_update_retire_capability(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})

        created = client.post(
            "/api/v1/capabilities",
            json={
                "name": "Supplier Management",
                "description": "Manage supplier performance and resilience",
                "category": "Supply Chain",
                "status": "Draft",
                "owner_organization_id": "CORP",
            },
        )
        assert created.status_code == 200
        capability = created.json()
        assert capability["name"] == "Supplier Management"

        updated = client.put(
            f"/api/v1/capabilities/{capability['id']}",
            json={"status": "Active"},
        )
        assert updated.status_code == 200
        assert updated.json()["status"] == "Active"

        retired = client.patch(f"/api/v1/capabilities/{capability['id']}/retire")
        assert retired.status_code == 200
        assert retired.json()["status"] == "Retired"

    def test_link_capability_to_choice_and_resolve_detail(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})
        created_cycle = client.post(
            "/api/v1/planning-cycles",
            json={"name": "FY2036 Planning", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert created_cycle.status_code == 200
        cycle_id = created_cycle.json()["id"]

        created_question = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-questions",
            json={
                "planning_cycle_id": cycle_id,
                "title": "How can we improve fulfillment reliability?",
                "priority": "High",
                "status": "Active",
                "lead_organization_id": "CORP",
            },
        )
        assert created_question.status_code == 200
        question_id = created_question.json()["id"]

        created_objective = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_question_id": question_id,
                "title": "Improve fulfillment reliability",
                "objective_type": "Operational Excellence",
                "priority": "High",
                "status": "Active",
                "owner_organization_id": "CORP",
            },
        )
        assert created_objective.status_code == 200
        objective_id = created_objective.json()["id"]

        created_choice = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_objective_id": objective_id,
                "title": "Implement digital supplier portal",
                "choice_type": "Technology",
                "status": "Under Evaluation",
                "recommendation": "No Recommendation",
                "owner_organization_id": "CORP",
            },
        )
        assert created_choice.status_code == 200
        choice_id = created_choice.json()["id"]

        created_agreement = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/agreements",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_choice_id": choice_id,
                "title": "Portal rollout agreement",
                "status": "Approved",
                "owner_organization_id": "CORP",
            },
        )
        assert created_agreement.status_code == 200

        created_capability = client.post(
            "/api/v1/capabilities",
            json={
                "name": "Supplier Management",
                "category": "Supply Chain",
                "status": "Active",
                "owner_organization_id": "CORP",
            },
        )
        assert created_capability.status_code == 200
        capability_id = created_capability.json()["id"]

        linked = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/capabilities",
            json={"capability_id": capability_id},
        )
        assert linked.status_code == 200

        list_linked = client.get(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/capabilities"
        )
        assert list_linked.status_code == 200
        assert len(list_linked.json()) == 1

        detail = client.get(f"/api/v1/capabilities/{capability_id}/detail")
        assert detail.status_code == 200
        body = detail.json()
        assert len(body["linked_choices"]) == 1
        assert len(body["linked_agreements"]) == 1

        unlinked = client.delete(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/capabilities/{capability_id}"
        )
        assert unlinked.status_code == 200

    def test_create_and_update_capability_assessment(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})

        created_cycle = client.post(
            "/api/v1/planning-cycles",
            json={"name": "FY2037 Planning", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert created_cycle.status_code == 200
        cycle_id = created_cycle.json()["id"]

        created_capability = client.post(
            "/api/v1/capabilities",
            json={
                "name": "Industrial Automation",
                "category": "Technology",
                "status": "Active",
                "owner_organization_id": "CORP",
            },
        )
        assert created_capability.status_code == 200
        capability_id = created_capability.json()["id"]

        created_assessment = client.post(
            f"/api/v1/capabilities/{capability_id}/assessments",
            json={
                "capability_id": capability_id,
                "planning_cycle_id": cycle_id,
                "current_maturity": 2,
                "target_maturity": 4,
                "assessment_notes": "Automation standards partially adopted",
                "owner_organization_id": "CORP",
            },
        )
        assert created_assessment.status_code == 200
        assessment = created_assessment.json()
        assert assessment["assessment_gap"] == 2

        updated_assessment = client.put(
            f"/api/v1/capabilities/{capability_id}/assessments/{assessment['id']}",
            json={
                "current_maturity": 3,
                "target_maturity": 4,
            },
        )
        assert updated_assessment.status_code == 200
        assert updated_assessment.json()["assessment_gap"] == 1

        listed_assessments = client.get(f"/api/v1/capabilities/{capability_id}/assessments")
        assert listed_assessments.status_code == 200
        assert len(listed_assessments.json()) == 1

    def test_capability_roadmap_defaults_gap_of_one_when_unassessed(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})

        created_capability = client.post(
            "/api/v1/capabilities",
            json={
                "name": "Digital Commerce",
                "category": "Technology",
                "status": "Active",
                "owner_organization_id": "CORP",
                "start_date": "2027-01-01T00:00:00",
                "end_date": "2027-06-30T00:00:00",
            },
        )
        assert created_capability.status_code == 200
        capability_id = created_capability.json()["id"]

        roadmap = client.get("/api/v1/capabilities/roadmap")
        assert roadmap.status_code == 200
        items = roadmap.json()
        assert len(items) == 1
        item = items[0]
        assert item["capability_id"] == capability_id
        assert item["current_maturity"] == 1
        assert item["target_maturity"] == 2
        assert item["assessment_gap"] == 1
        assert item["start_date"].startswith("2027-01-01")
        assert item["end_date"].startswith("2027-06-30")
        assert item["latest_assessment_id"] is None

    def test_capability_schedule_rejects_reversed_dates_and_supports_clearing(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})
        payload = {
            "name": "Digital Commerce",
            "owner_organization_id": "CORP",
            "start_date": "2027-01-01T00:00:00Z",
            "end_date": "2027-06-30T00:00:00",
        }
        collection_url = "/api/v1/capabilities"

        invalid_create = client.post(collection_url, json={**payload, "end_date": "2026-12-31T00:00:00"})
        assert invalid_create.status_code == 400
        assert client.get(collection_url).json() == []

        created = client.post(collection_url, json=payload)
        assert created.status_code == 200
        capability = created.json()
        capability_url = f"{collection_url}/{capability['id']}"

        for update in (
            {"start_date": "2027-07-01T00:00:00Z"},
            {"end_date": "2026-12-31T00:00:00Z"},
        ):
            rejected = client.put(capability_url, json=update)
            assert rejected.status_code == 400
            assert client.get(capability_url).json() == capability

        same_day = client.put(capability_url, json={"end_date": payload["start_date"]})
        assert same_day.status_code == 200
        assert same_day.json()["end_date"] == same_day.json()["start_date"]

        cleared_start = client.put(capability_url, json={"start_date": None})
        assert cleared_start.status_code == 200
        assert cleared_start.json()["start_date"] is None
        assert cleared_start.json()["end_date"] == same_day.json()["end_date"]

        cleared_end = client.put(capability_url, json={"end_date": None})
        assert cleared_end.status_code == 200
        roadmap = client.get(f"{collection_url}/roadmap")
        assert roadmap.status_code == 200
        assert roadmap.json()[0]["start_date"] is None
        assert roadmap.json()[0]["end_date"] is None

    def test_capability_roadmap_uses_latest_assessment_gap(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})

        created_cycle = client.post(
            "/api/v1/planning-cycles",
            json={"name": "FY2039 Planning", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert created_cycle.status_code == 200
        cycle_id = created_cycle.json()["id"]

        created_capability = client.post(
            "/api/v1/capabilities",
            json={
                "name": "Supplier Management",
                "category": "Supply Chain",
                "status": "Active",
                "owner_organization_id": "CORP",
                "start_date": "2027-02-01T00:00:00",
                "end_date": "2027-11-30T00:00:00",
            },
        )
        assert created_capability.status_code == 200
        capability_id = created_capability.json()["id"]

        created_assessment = client.post(
            f"/api/v1/capabilities/{capability_id}/assessments",
            json={
                "capability_id": capability_id,
                "planning_cycle_id": cycle_id,
                "current_maturity": 2,
                "target_maturity": 5,
                "owner_organization_id": "CORP",
            },
        )
        assert created_assessment.status_code == 200

        roadmap = client.get("/api/v1/capabilities/roadmap")
        assert roadmap.status_code == 200
        items = roadmap.json()
        assert len(items) == 1
        item = items[0]
        assert item["current_maturity"] == 2
        assert item["target_maturity"] == 5
        assert item["assessment_gap"] == 3
        assert item["latest_assessment_id"] == created_assessment.json()["id"]

    def test_capability_assessment_rejects_invalid_maturity(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})

        created_cycle = client.post(
            "/api/v1/planning-cycles",
            json={"name": "FY2037 Planning", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert created_cycle.status_code == 200
        cycle_id = created_cycle.json()["id"]

        created_capability = client.post(
            "/api/v1/capabilities",
            json={
                "name": "Predictive Maintenance",
                "category": "Operations",
                "status": "Active",
                "owner_organization_id": "CORP",
            },
        )
        assert created_capability.status_code == 200
        capability_id = created_capability.json()["id"]

        bad_assessment = client.post(
            f"/api/v1/capabilities/{capability_id}/assessments",
            json={
                "capability_id": capability_id,
                "planning_cycle_id": cycle_id,
                "current_maturity": 0,
                "target_maturity": 6,
                "assessment_notes": "Invalid sample",
                "owner_organization_id": "CORP",
            },
        )
        assert bad_assessment.status_code == 400

    def test_create_update_and_detail_initiative_with_links(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})

        cycle_id, _, objective_id, choice_id = create_choice_traceability_chain("CORP", "FY2038 Planning")

        created_capability = client.post(
            "/api/v1/capabilities",
            json={
                "name": "Execution Governance",
                "category": "Operations",
                "status": "Active",
                "owner_organization_id": "CORP",
            },
        )
        assert created_capability.status_code == 200
        capability_id = created_capability.json()["id"]

        linked_choice_capability = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/capabilities",
            json={"capability_id": capability_id},
        )
        assert linked_choice_capability.status_code == 200

        created_agreement = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/agreements",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_choice_id": choice_id,
                "title": "Execution charter",
                "status": "Approved",
                "owner_organization_id": "CORP",
            },
        )
        assert created_agreement.status_code == 200
        agreement_id = created_agreement.json()["id"]

        created_initiative = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives",
            json={
                "planning_cycle_id": cycle_id,
                "name": "Plant automation pilot",
                "description": "First execution artifact for approved choice",
                "status": "Planned",
                "owner_organization_id": "CORP",
                "start_date": "2038-01-10T00:00:00Z",
                "end_date": "2038-06-30T00:00:00Z",
                "budget": 2500000,
            },
        )
        assert created_initiative.status_code == 200
        initiative = created_initiative.json()
        initiative_id = initiative["id"]
        assert initiative["name"] == "Plant automation pilot"
        assert initiative["status"] == "Planned"

        listed_initiatives = client.get(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives"
        )
        assert listed_initiatives.status_code == 200
        assert len(listed_initiatives.json()) == 1

        attached_capability = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives/{initiative_id}/capabilities/{capability_id}"
        )
        assert attached_capability.status_code == 200

        attached_agreement = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives/{initiative_id}/agreements/{agreement_id}"
        )
        assert attached_agreement.status_code == 200

        initiative_detail = client.get(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives/{initiative_id}/detail"
        )
        assert initiative_detail.status_code == 200
        detail_body = initiative_detail.json()
        assert len(detail_body["linked_choices"]) == 1
        assert len(detail_body["linked_capabilities"]) == 1
        assert len(detail_body["linked_agreements"]) == 1

        updated_initiative = client.put(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives/{initiative_id}",
            json={
                "status": "In Progress",
                "budget": 2750000,
            },
        )
        assert updated_initiative.status_code == 200
        assert updated_initiative.json()["status"] == "In Progress"
        assert updated_initiative.json()["budget"] == 2750000

    def test_initiative_rejects_invalid_status(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})

        cycle_id, _, objective_id, choice_id = create_choice_traceability_chain("CORP", "FY2039 Planning")

        bad_status = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives",
            json={
                "planning_cycle_id": cycle_id,
                "name": "Invalid status initiative",
                "status": "Draft",
                "owner_organization_id": "CORP",
            },
        )
        assert bad_status.status_code == 400

    def test_attach_capability_to_initiative_requires_choice_capability_link(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})

        cycle_id, _, objective_id, choice_id = create_choice_traceability_chain("CORP", "FY2040 Planning")

        created_capability = client.post(
            "/api/v1/capabilities",
            json={
                "name": "Program Office",
                "category": "Operations",
                "status": "Active",
                "owner_organization_id": "CORP",
            },
        )
        assert created_capability.status_code == 200
        capability_id = created_capability.json()["id"]

        created_initiative = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives",
            json={
                "planning_cycle_id": cycle_id,
                "name": "Execution PMO setup",
                "status": "Proposed",
                "owner_organization_id": "CORP",
            },
        )
        assert created_initiative.status_code == 200
        initiative_id = created_initiative.json()["id"]

        bad_attach = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives/{initiative_id}/capabilities/{capability_id}"
        )
        assert bad_attach.status_code == 400

    def test_attach_agreement_to_initiative_requires_same_choice(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})

        cycle_id, question_id, objective_id, first_choice_id = create_choice_traceability_chain("CORP", "FY2041 Planning")

        second_choice = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_objective_id": objective_id,
                "title": "Alternative execution path",
                "choice_type": "Operating Model",
                "status": "Under Evaluation",
                "recommendation": "No Recommendation",
                "owner_organization_id": "CORP",
            },
        )
        assert second_choice.status_code == 200
        second_choice_id = second_choice.json()["id"]

        created_initiative = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{first_choice_id}/initiatives",
            json={
                "planning_cycle_id": cycle_id,
                "name": "Primary initiative",
                "status": "Planned",
                "owner_organization_id": "CORP",
            },
        )
        assert created_initiative.status_code == 200
        initiative_id = created_initiative.json()["id"]

        second_choice_agreement = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{second_choice_id}/agreements",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_choice_id": second_choice_id,
                "title": "Alternative agreement",
                "status": "Approved",
                "owner_organization_id": "CORP",
            },
        )
        assert second_choice_agreement.status_code == 200
        agreement_id = second_choice_agreement.json()["id"]

        bad_attach = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{first_choice_id}/initiatives/{initiative_id}/agreements/{agreement_id}"
        )
        assert bad_attach.status_code == 400

    def test_initiative_rejects_cross_cycle_choice_context(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})

        cycle_a_id, _, objective_a_id, choice_a_id = create_choice_traceability_chain("CORP", "Cycle A")
        created_cycle_b = client.post(
            "/api/v1/planning-cycles",
            json={"name": "Cycle B", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert created_cycle_b.status_code == 200
        cycle_b_id = created_cycle_b.json()["id"]

        bad_create = client.post(
            f"/api/v1/planning-cycles/{cycle_b_id}/strategic-objectives/{objective_a_id}/choices/{choice_a_id}/initiatives",
            json={
                "planning_cycle_id": cycle_b_id,
                "name": "Cross-cycle initiative",
                "status": "Proposed",
                "owner_organization_id": "CORP",
            },
        )
        assert bad_create.status_code == 404

    def test_create_outcome_and_track_metric_results(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})

        cycle_id, _, objective_id, choice_id = create_choice_traceability_chain("CORP", "FY2042 Planning")

        created_initiative = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives",
            json={
                "planning_cycle_id": cycle_id,
                "name": "Cost reduction program",
                "status": "Planned",
                "owner_organization_id": "CORP",
            },
        )
        assert created_initiative.status_code == 200
        initiative_id = created_initiative.json()["id"]

        created_outcome = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/initiatives/{initiative_id}/outcomes",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_objective_id": objective_id,
                "initiative_id": initiative_id,
                "name": "Operational Cost Reduction",
                "description": "Reduce cost per ton through execution",
            },
        )
        assert created_outcome.status_code == 200
        outcome_id = created_outcome.json()["id"]

        listed_outcomes = client.get(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/initiatives/{initiative_id}/outcomes"
        )
        assert listed_outcomes.status_code == 200
        assert len(listed_outcomes.json()) == 1

        created_metric = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/initiatives/{initiative_id}/outcomes/{outcome_id}/metrics",
            json={
                "outcome_id": outcome_id,
                "name": "Cost Per Ton",
                "unit": "Percent",
                "target": {
                    "target_value": -10,
                    "target_unit": "%",
                    "target_date": "2042-12-31T00:00:00Z",
                    "notes": "Expected reduction versus baseline",
                },
                "actual": {
                    "actual_value": -7,
                    "actual_unit": "%",
                    "measured_at": "2042-06-30T00:00:00Z",
                    "notes": "Mid-year performance",
                },
            },
        )
        assert created_metric.status_code == 200
        metric_body = created_metric.json()
        assert metric_body["target"]["target_value"] == -10
        assert len(metric_body["actuals"]) == 1
        assert metric_body["actuals"][0]["actual_value"] == -7

        updated_metric = client.put(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/initiatives/{initiative_id}/outcomes/{outcome_id}/metrics/{metric_body['id']}",
            json={
                "actual": {
                    "actual_value": -6,
                    "actual_unit": "%",
                    "measured_at": "2042-09-30T00:00:00Z",
                },
            },
        )
        assert updated_metric.status_code == 200
        assert len(updated_metric.json()["actuals"]) == 2

        detail = client.get(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/initiatives/{initiative_id}/outcomes/{outcome_id}/detail"
        )
        assert detail.status_code == 200
        detail_body = detail.json()
        assert detail_body["linked_metrics"][0]["name"] == "Cost Per Ton"
        assert detail_body["linked_metrics"][0]["target"]["target_value"] == -10
        assert len(detail_body["linked_metrics"][0]["actuals"]) == 2

    def test_outcome_rejects_wrong_objective_context(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})

        cycle_a_id, _, objective_a_id, choice_a_id = create_choice_traceability_chain("CORP", "Cycle A")
        created_initiative = client.post(
            f"/api/v1/planning-cycles/{cycle_a_id}/strategic-objectives/{objective_a_id}/choices/{choice_a_id}/initiatives",
            json={
                "planning_cycle_id": cycle_a_id,
                "name": "Execution initiative",
                "status": "Planned",
                "owner_organization_id": "CORP",
            },
        )
        assert created_initiative.status_code == 200
        initiative_id = created_initiative.json()["id"]

        created_cycle_b = client.post(
            "/api/v1/planning-cycles",
            json={"name": "Cycle B", "owner_organization_id": "CORP", "status": "Draft"},
        )
        assert created_cycle_b.status_code == 200
        cycle_b_id = created_cycle_b.json()["id"]
        question_b = client.post(
            f"/api/v1/planning-cycles/{cycle_b_id}/strategic-questions",
            json={
                "planning_cycle_id": cycle_b_id,
                "title": "How do we improve outcomes?",
                "priority": "High",
                "status": "Active",
                "lead_organization_id": "CORP",
            },
        )
        assert question_b.status_code == 200
        objective_b = client.post(
            f"/api/v1/planning-cycles/{cycle_b_id}/strategic-objectives",
            json={
                "planning_cycle_id": cycle_b_id,
                "strategic_question_id": question_b.json()["id"],
                "title": "Improve customer satisfaction",
                "objective_type": "Customer",
                "priority": "High",
                "status": "Active",
                "owner_organization_id": "CORP",
            },
        )
        assert objective_b.status_code == 200

        bad_outcome = client.post(
            f"/api/v1/planning-cycles/{cycle_b_id}/strategic-objectives/{objective_b.json()['id']}/initiatives/{initiative_id}/outcomes",
            json={
                "planning_cycle_id": cycle_b_id,
                "strategic_objective_id": objective_b.json()["id"],
                "initiative_id": initiative_id,
                "name": "Invalid cross-cycle outcome",
            },
        )
        assert bad_outcome.status_code == 404

    def test_create_update_and_detail_strategy_review(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})

        cycle_id, _, objective_id, choice_id = create_choice_traceability_chain("CORP", "FY2043 Planning")
        initiative = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives",
            json={
                "planning_cycle_id": cycle_id,
                "name": "Review-linked initiative",
                "status": "Planned",
                "owner_organization_id": "CORP",
            },
        )
        assert initiative.status_code == 200
        initiative_id = initiative.json()["id"]

        outcome = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/initiatives/{initiative_id}/outcomes",
            json={
                "planning_cycle_id": cycle_id,
                "strategic_objective_id": objective_id,
                "initiative_id": initiative_id,
                "name": "Review-linked outcome",
            },
        )
        assert outcome.status_code == 200

        created_review = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/reviews",
            json={
                "planning_cycle_id": cycle_id,
                "date": "2043-06-30T00:00:00Z",
                "status": "Draft",
                "recommendations": "Continue execution focus",
                "summary": "Mid-year strategy review",
            },
        )
        assert created_review.status_code == 200
        review = created_review.json()
        review_id = review["id"]
        assert review["status"] == "Draft"

        listed_reviews = client.get(f"/api/v1/planning-cycles/{cycle_id}/reviews")
        assert listed_reviews.status_code == 200
        assert len(listed_reviews.json()) == 1

        detail = client.get(f"/api/v1/planning-cycles/{cycle_id}/reviews/{review_id}")
        assert detail.status_code == 200
        detail_body = detail.json()
        assert len(detail_body["linked_objectives"]) == 1
        assert len(detail_body["linked_initiatives"]) == 1
        assert len(detail_body["linked_outcomes"]) == 1
        assert detail_body["linked_initiatives"][0]["initiative_name"] == "Review-linked initiative"

        updated_review = client.put(
            f"/api/v1/planning-cycles/{cycle_id}/reviews/{review_id}",
            json={"status": "Completed", "summary": "Review complete"},
        )
        assert updated_review.status_code == 200
        assert updated_review.json()["status"] == "Completed"
        assert updated_review.json()["summary"] == "Review complete"

    def test_strategy_review_rejects_invalid_status(self):
        fake_db.collection("organizations").insert({"_key": "CORP", "name": "Corporate", "status": "active"})
        cycle_id, _, _, _ = create_choice_traceability_chain("CORP", "FY2044 Planning")

        bad_review = client.post(
            f"/api/v1/planning-cycles/{cycle_id}/reviews",
            json={
                "planning_cycle_id": cycle_id,
                "date": "2044-06-30T00:00:00Z",
                "status": "Pending",
            },
        )
        assert bad_review.status_code == 400

    def test_governance_config_round_trip(self):
        payload = {
            "enterprise_name": "Northwind Group",
            "enterprise_code": "NWG",
            "enterprise_description": "Global operating group",
            "planning_cycles": ["Annual Planning", "Quarterly Review"],
            "strategy_authority_rules": ["Autonomous requires oversight"],
            "alignment_scoring_rules": ["Score contract coverage"],
            "required_strategy_artifacts": ["North Star", "Objectives"],
            "strategy_review_cadence": "Quarterly Business Review",
            "contract_templates": ["Alignment"],
            "planning_windows": ["Q1", "Q3"],
            "governance_policies": ["Review required"],
            "escalation_workflows": ["BU -> Admin"],
        }

        response = client.put("/api/v1/governance/config", json=payload)
        assert response.status_code == 200
        assert response.json()["enterprise_name"] == payload["enterprise_name"]
        assert response.json()["planning_cycles"] == payload["planning_cycles"]

        fetched = client.get("/api/v1/governance/config")
        assert fetched.status_code == 200
        assert fetched.json()["enterprise_name"] == "Northwind Group"
        assert fetched.json()["strategy_review_cadence"] == "Quarterly Business Review"
