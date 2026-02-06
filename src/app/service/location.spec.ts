import { TestBed } from '@angular/core/testing';


describe('Location', () => {
  let service: Location;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Location);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
